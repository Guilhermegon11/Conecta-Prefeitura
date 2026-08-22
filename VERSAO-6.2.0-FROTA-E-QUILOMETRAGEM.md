# Prefeitura Conecta 6.2.0 — Frota e Quilometragem

## Objetivo

Permitir que o funcionário responsável por transporte registre, de forma simples e rastreável, a quilometragem no início e no final de cada jornada de um veículo municipal.

## Fluxo operacional

1. O responsável cadastra o veículo com placa ou prefixo, identificação, modelo e hodômetro atual.
2. Antes da saída, o funcionário seleciona o veículo, informa a data, a quilometragem inicial e uma observação opcional.
3. A jornada fica visível como aberta e impede uma segunda saída do mesmo veículo.
4. Na devolução, o funcionário informa a quilometragem final e eventuais ocorrências.
5. O sistema calcula a distância percorrida, atualiza o hodômetro do veículo e bloqueia o registro concluído para preservar a auditoria.

## API REST

### Veículos

- `GET /api/fleet/vehicles?department=...` — consulta a frota do setor.
- `POST /api/fleet/vehicles` — cadastra um veículo.
- `PATCH /api/fleet/vehicles` — atualiza dados ou ativa/inativa o veículo.

### Quilometragem

- `GET /api/fleet/mileage?department=...` — consulta registros, com filtros opcionais `vehicleId`, `status`, `date`, `from`, `to` e `limit`.
- `POST /api/fleet/mileage` — registra a quilometragem inicial e abre a jornada.
- `PATCH /api/fleet/mileage` — registra a quilometragem final e encerra a jornada.

Todas as rotas exigem sessão válida, retornam respostas JSON, desabilitam cache e utilizam códigos HTTP adequados para validação, conflito, ausência de registro e indisponibilidade do banco.

## Regras e segurança dos dados

- um registro por veículo e data;
- apenas uma jornada aberta por veículo;
- quilometragem inicial nunca inferior ao hodômetro atual;
- quilometragem final nunca inferior à inicial;
- veículo inativo não pode iniciar jornada;
- veículo com jornada aberta não pode ser inativado;
- registros concluídos não podem ser reabertos pela API operacional;
- criação de veículo, atualização, início e encerramento geram trilha de auditoria;
- dados e consultas são separados por setor.

## Banco de dados

A migração `drizzle/0007_blue_guardian.sql` cria:

- `fleet_vehicles`;
- `fleet_mileage_records`;
- `fleet_audit_logs`;
- índices e restrições de unicidade necessários ao fluxo.

## Interface

O módulo oferece resumo de veículos e jornadas, formulário guiado para saída, painel de devolução, cadastro da frota, filtros de histórico, exportação CSV, estados de carregamento/erro/vazio e layout responsivo para celular, tablet e desktop.
