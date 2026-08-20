# Prefeitura Conecta v4.9.4 — GPS convertido em endereço

## Alteração solicitada

O botão **Usar GPS** não exibe mais latitude e longitude no formulário. Depois de obter a localização do dispositivo, o sistema identifica o endereço correspondente e preenche o campo de rua/endereço automaticamente.

## Funcionamento

- Busca o endereço aproximado a partir da posição atual.
- Preenche rua, número disponível, bairro e município.
- Não mostra coordenadas na interface.
- Mantém as coordenadas somente como metadado técnico para mapa e rastreabilidade.
- Se o endereço não puder ser identificado, solicita o preenchimento manual sem exibir números de latitude ou longitude.
- O cadastro de chamados também recebeu o mesmo comportamento.

A identificação depende da permissão de localização do navegador, de conexão com a internet e da cobertura de endereços do OpenStreetMap.
