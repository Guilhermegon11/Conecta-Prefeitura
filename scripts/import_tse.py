#!/usr/bin/env python3
"""Importa apenas dados públicos necessários de candidaturas MG/BR (TSE).

Uso: python import_tse.py --output ./research [--refresh] [--skip-photos]
Não filtra candidaturas por situação; a metodologia da pesquisa deve determinar
quais registros podem ser apresentados. CPF, e-mail e outros campos não usados
não são incluídos na saída. Requer somente a biblioteca padrão de Python.
"""
from __future__ import annotations
import argparse
import collections
import csv
import datetime
import gzip
import hashlib
import io
import json
import pathlib
import urllib.request
import zipfile

DATASET = 'https://dadosabertos.tse.jus.br/dataset/candidatos-2026'
API = 'https://dadosabertos.tse.jus.br/api/3/action/package_show?id=candidatos-2026'
MUNICIPALITIES = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados/31/municipios?orderBy=nome'
OFFICES = {'DEPUTADO FEDERAL': 'federal', 'DEPUTADO ESTADUAL': 'estadual',
           'SENADOR': 'senador', 'GOVERNADOR': 'governador', 'PRESIDENTE': 'presidente'}
NULLS = {'', '#NE', '#NULO', '-1', '-3'}


def fetch(url: str, path: pathlib.Path, refresh: bool) -> bytes:
    if path.exists() and not refresh:
        data = path.read_bytes()
    else:
        req = urllib.request.Request(url, headers={'User-Agent': 'Minas-Pesquisa-Import/1.0'})
        with urllib.request.urlopen(req, timeout=60) as response:
            data = response.read()
        if data[:2] == b'\x1f\x8b':
            data = gzip.decompress(data)
        path.write_bytes(data)
    return data


def read_csv(z: zipfile.ZipFile, path: str):
    raw = z.read(path)
    try:
        content = raw.decode('utf-8-sig')
    except UnicodeDecodeError:
        content = raw.decode('latin-1')
    return list(csv.DictReader(io.StringIO(content), delimiter=';'))


def clean(value: str | None):
    return None if value in NULLS or value is None else value


def write_json(path: pathlib.Path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=pathlib.Path, default=pathlib.Path(__file__).parent)
    parser.add_argument('--refresh', action='store_true')
    parser.add_argument('--skip-photos', action='store_true')
    args = parser.parse_args()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    metadata = json.loads(fetch(API, output / 'tse_dataset_metadata.json', args.refresh))['result']
    resources = {r['name']: r for r in metadata['resources']}
    files = {'Candidatos': 'candidates.zip', 'Candidatos - Informações complementares': 'complementary.zip'}
    archives = {}
    for name, filename in files.items():
        payload = fetch(resources[name]['url'], output / filename, args.refresh)
        archives[name] = zipfile.ZipFile(io.BytesIO(payload))
    candidates = []
    status_review = []
    generations = set()
    complement_generations = set()
    for uf in ['MG', 'BR']:
        rows = read_csv(archives['Candidatos'], f'consulta_cand_2026_{uf}.csv')
        complements = read_csv(archives['Candidatos - Informações complementares'], f'consulta_cand_complementar_2026_{uf}.csv')
        extras = {r['SQ_CANDIDATO']: r for r in complements}
        complement_generations.update(f"{r['DT_GERACAO']} {r['HH_GERACAO']}" for r in complements)
        for row in rows:
            office = row['DS_CARGO']
            if office not in OFFICES or (uf == 'BR' and office != 'PRESIDENTE'):
                continue
            if str(row['ANO_ELEICAO']) != '2026':
                raise ValueError('Arquivo contém ano de eleição inesperado')
            x = extras.get(row['SQ_CANDIDATO'], {})
            generations.add(f"{row['DT_GERACAO']} {row['HH_GERACAO']}")
            status = clean(x.get('DS_SITUACAO_JULGAMENTO')) or clean(row.get('DS_SITUACAO_CANDIDATURA'))
            status_fields = ['CD_SITUACAO_JULGAMENTO', 'DS_SITUACAO_JULGAMENTO',
                'CD_SITUACAO_JULGAMENTO_PLEITO', 'DS_SITUACAO_JULGAMENTO_PLEITO',
                'CD_SITUACAO_JULGAMENTO_URNA', 'DS_SITUACAO_JULGAMENTO_URNA',
                'CD_SITUACAO_CANDIDATO_TOT', 'DS_SITUACAO_CANDIDATO_TOT',
                'ST_CANDIDATO_INSERIDO_URNA', 'ST_SUBSTITUIDO', 'SQ_SUBSTITUIDO',
                'CD_SITUACAO_CASSACAO', 'DS_SITUACAO_CASSACAO',
                'CD_SITUACAO_CASSACAO_MIDIA', 'DS_SITUACAO_CASSACAO_MIDIA']
            status_review.append({'id': row['SQ_CANDIDATO'],
                'office': OFFICES[office],
                'CD_SITUACAO_CANDIDATURA': row.get('CD_SITUACAO_CANDIDATURA'),
                'DS_SITUACAO_CANDIDATURA': row.get('DS_SITUACAO_CANDIDATURA'),
                **{field: x.get(field) for field in status_fields}})
            candidates.append({
                'id': row['SQ_CANDIDATO'], 'name': row['NM_URNA_CANDIDATO'],
                'number': row['NR_CANDIDATO'], 'party': row['SG_PARTIDO'],
                'partyNumber': row['NR_PARTIDO'], 'office': OFFICES[office],
                'officeLabel': office, 'uf': row['SG_UF'],
                'status': status, 'statusCode': clean(x.get('CD_SITUACAO_JULGAMENTO')),
                'ballotStatus': clean(x.get('DS_SITUACAO_JULGAMENTO_URNA')),
                'inBallot': str(x.get('ST_CANDIDATO_INSERIDO_URNA', '')).upper() in {'SIM', 'S'},
                'substituted': str(x.get('ST_SUBSTITUIDO', '')).upper() in {'SIM', 'S'}, 'photo': None,
            })
    if len({r['id'] for r in candidates}) != len(candidates):
        raise ValueError('IDs de candidaturas duplicados na base')
    if {r['office'] for r in candidates} != set(OFFICES.values()):
        raise ValueError('Nem todos os cargos esperados foram encontrados')
    photo_sources = []
    if not args.skip_photos:
        photo_dir = output / 'photos'
        photo_dir.mkdir(exist_ok=True)
        by_id = {r['id']: r for r in candidates}
        for uf in ['MG', 'BR']:
            resource = resources[f'{uf} - Fotos de candidatos']
            photo_sources.append(resource['url'])
            raw = fetch(resource['url'], output / f'photos_{uf}.zip', args.refresh)
            with zipfile.ZipFile(io.BytesIO(raw)) as z:
                for name in z.namelist():
                    base = pathlib.PurePosixPath(name).name
                    if not base.startswith(f'F{uf}') or not base.endswith('_div.jpg'):
                        continue
                    candidate_id = base[len(f'F{uf}'):-len('_div.jpg')]
                    if candidate_id not in by_id:
                        continue
                    image_data = z.read(name)
                    if image_data[:2] != b'\xff\xd8':
                        raise ValueError(f'Foto não contém JPEG válido: {base}')
                    (photo_dir / f'{candidate_id}.jpg').write_bytes(image_data)
                    by_id[candidate_id]['photo'] = f'/candidates/{candidate_id}.jpg'
    candidates.sort(key=lambda x: (x['office'], x['name'], x['id']))
    write_json(output / 'candidates.json', candidates)
    write_json(output / 'candidates.status-review.json', status_review)
    municipalities_raw = json.loads(fetch(MUNICIPALITIES, output / 'municipalities_raw.json', args.refresh))
    municipalities = [{'id': str(m['id']), 'name': m['nome'], 'uf': 'MG'} for m in municipalities_raw]
    if len(municipalities) != 853 or len({m['id'] for m in municipalities}) != 853:
        raise ValueError('Quantidade inesperada de municípios MG; revisar fonte IBGE')
    write_json(output / 'municipalities.json', municipalities)
    counts = dict(collections.Counter(c['office'] for c in candidates))
    generated = {
        'source': 'Tribunal Superior Eleitoral — Portal de Dados Abertos',
        'dataset': DATASET,
        'resource': f"{DATASET}/resource/{resources['Candidatos']['id']}",
        'sourceUrls': [resources[name]['url'] for name in files] + photo_sources,
        'retrievedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'sourceGeneratedAt': sorted(generations),
        'complementGeneratedAt': sorted(complement_generations),
        'electionYear': 2026, 'geography': 'MG + candidatos nacionais à Presidência',
        'count': len(candidates), 'countsByOffice': counts,
        'countsByStatus': dict(collections.Counter(c['status'] for c in candidates)),
        'photos': sum(bool(c['photo']) for c in candidates),
        'municipalities': {'source': 'IBGE — API de Localidades', 'url': MUNICIPALITIES, 'count': len(municipalities), 'codeType': 'IBGE'},
        'license': metadata.get('license_title'),
        'selectionPolicy': 'Todos os registros oficiais dos cargos definidos foram preservados; não há exclusão automática por situação, renúncia ou substituição. Revisão da lista de exibição é necessária conforme a metodologia aplicável.',
        'fieldMappings': {
            'id': 'SQ_CANDIDATO', 'name': 'NM_URNA_CANDIDATO',
            'number': 'NR_CANDIDATO', 'party': 'SG_PARTIDO',
            'office': 'DS_CARGO', 'uf': 'SG_UF',
            'status': 'DS_SITUACAO_JULGAMENTO',
            'statusCode': 'CD_SITUACAO_JULGAMENTO',
            'ballotStatus': 'DS_SITUACAO_JULGAMENTO_URNA',
            'inBallot': {'field': 'ST_CANDIDATO_INSERIDO_URNA', 'trueValues': ['SIM', 'S']},
            'substituted': {'field': 'ST_SUBSTITUIDO', 'trueValues': ['SIM', 'S']},
        },
        'rawStatusCounts': {field: dict(collections.Counter(r.get(field) for r in status_review))
            for field in ['CD_SITUACAO_JULGAMENTO','DS_SITUACAO_JULGAMENTO',
                'DS_SITUACAO_JULGAMENTO_PLEITO','DS_SITUACAO_JULGAMENTO_URNA',
                'ST_CANDIDATO_INSERIDO_URNA','ST_SUBSTITUIDO']},
        'statusReviewFile': 'candidates.status-review.json',
        'eligibilityNote': 'DS_SITUACAO_JULGAMENTO separa INDEFERIDO de INDEFERIDO EM PRAZO RECURSAL OU COM RECURSO. O rótulo INDEFERIDO, isoladamente, não fornece certidão de trânsito em julgado. Flags de urna não substituem a revisão da metodologia da pesquisa. Esta importação não define elegibilidade jurídica.',
        'statusField': 'DS_SITUACAO_JULGAMENTO do arquivo complementar, com fallback para DS_SITUACAO_CANDIDATURA. Campos #NE/#NULO são convertidos em null.',
        'hashes': {name: hashlib.sha256((output / name).read_bytes()).hexdigest() for name in ['candidates.zip','complementary.zip','candidates.json','municipalities.json']},
    }
    write_json(output / 'candidates.metadata.json', generated)
    print(json.dumps({'count':len(candidates),'byOffice':counts,'photos':generated['photos'],'municipalities':len(municipalities),'sourceGeneratedAt':sorted(generations)},ensure_ascii=False,indent=2))

if __name__ == '__main__':
    main()
