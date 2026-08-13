DROP INDEX IF EXISTS `users_email_unique`;
UPDATE `users` SET `full_name` = 'Artur Paulo Fagundes Rabelo', `email` = 'gabinete@varzeadapalma.mg.gov.br', `department` = 'Secretaria de Governo', `role` = 'administrador', `initials` = 'AR' WHERE `id` = 'u-ana';
UPDATE `users` SET `full_name` = 'Bruno Gonçalves da Fonseca', `email` = 'obras@varzeadapalma.mg.gov.br', `department` = 'Secretaria de Infraestrutura e Transporte', `role` = 'secretario', `initials` = 'BF' WHERE `id` = 'u-rafael';
UPDATE `users` SET `full_name` = 'Natália Cristina Pedrosa Cabral', `email` = 'saude@varzeadapalma.mg.gov.br', `department` = 'Secretaria de Saúde', `role` = 'secretaria', `initials` = 'NC' WHERE `id` = 'u-lucas';
UPDATE `users` SET `full_name` = 'Leila Cibeli Silveira Mendes', `email` = 'semec@varzeadapalma.mg.gov.br', `department` = 'Secretaria de Educação', `role` = 'secretaria', `initials` = 'LM' WHERE `id` = 'u-amanda';
UPDATE `users` SET `full_name` = 'Jaime de Souza', `email` = 'financas@varzeadapalma.mg.gov.br', `department` = 'Secretaria de Administração e Finanças', `role` = 'secretario', `initials` = 'JS' WHERE `id` = 'u-carla';
UPDATE `users` SET `full_name` = 'Lucas Fontinelli de Oliveira da Silva', `email` = 'desenvolvimentoeconomico@varzeadapalma.mg.gov.br', `department` = 'Secretaria Municipal de Desenvolvimento Econômico, Agricultura e Meio Ambiente', `role` = 'secretario', `initials` = 'LS' WHERE `id` = 'u-felipe';

INSERT OR IGNORE INTO `users` (`id`,`full_name`,`email`,`department`,`role`,`initials`,`created_at`) VALUES
('u-rosilene','Rosilene Soares Souza Carvalho','controladoria@varzeadapalma.mg.gov.br','Controle Interno','controladora interna','RC','2026-08-13T17:00:00.000Z'),
('u-rodrigo','Rodrigo Aguiar Dalla Bernardina','gabinete@varzeadapalma.mg.gov.br','Gabinete do Prefeito','chefe de gabinete','RB','2026-08-13T17:00:00.000Z'),
('u-wharley','Wharley Marques de Lima','ascompalma@gmail.com','Secretaria de Comunicação e Eventos','secretario','WL','2026-08-13T17:00:00.000Z'),
('u-guilherme','Guilherme Oliveira Fonseca','smds@varzeadapalma.mg.gov.br','Secretaria de Desenvolvimento Social','secretario','GF','2026-08-13T17:00:00.000Z'),
('u-pedro','Pedro Umberto Baeta Camargos','cultura@varzeadapalma.mg.gov.br','Secretaria de Cultura e Turismo','secretario','PC','2026-08-13T17:00:00.000Z'),
('u-alan','Alan Kelve','secretariaobras50@gmail.com','Departamento de Execução de Obras','responsavel','AK','2026-08-13T17:00:00.000Z'),
('u-mauricio','Maurício Hugel de Azevedo','transportes.vzp@hotmail.com','Departamento de Transportes','responsavel','MA','2026-08-13T17:00:00.000Z'),
('u-junio','Júnio Fernandes da Silva','esporte.vzp@gmail.com','Departamento de Esporte e Lazer / Subseção de Esportes','responsavel','JF','2026-08-13T17:00:00.000Z'),
('u-paula','Paula Patrício Silva','vigilanciaemsaude@varzeadapalma.mg.gov.br','Departamento de Vigilância Sanitária','responsavel','PS','2026-08-13T17:00:00.000Z'),
('u-anselmo','Anselmo Caetano de Paula','semedpedagogicovzp@gmail.com','Seção de Controle e Avaliação','responsavel','AP','2026-08-13T17:00:00.000Z'),
('u-marco','Marco Antonio Ramos','marco.ramos@educacao.mg.gov.br','Subseção de Patrimônio Histórico e Cultura','responsavel','MR','2026-08-13T17:00:00.000Z'),
('u-dalila','Dalila Correa','sub-prefeituraguaicui@hotmail.com','Subprefeitura da Barra do Guaicuí','subprefeita','DC','2026-08-13T17:00:00.000Z');

UPDATE `tickets` SET `department` = 'Secretaria de Infraestrutura e Transporte' WHERE `id` = 't-187';
UPDATE `tickets` SET `department` = 'Secretaria de Saúde' WHERE `id` = 't-186';
UPDATE `tickets` SET `department` = 'Secretaria de Educação' WHERE `id` = 't-185';
UPDATE `tickets` SET `department` = 'Secretaria de Administração e Finanças', `requester` = 'Secretaria de Governo' WHERE `id` = 't-184';
UPDATE `tickets` SET `department` = 'Secretaria Municipal de Desenvolvimento Econômico, Agricultura e Meio Ambiente', `requester` = 'Gabinete do Prefeito' WHERE `id` = 't-183';

UPDATE `messages` SET `conversation_id` = 'u-ana::u-rafael' WHERE `conversation_type` = 'direct' AND `conversation_id` = 'u-rafael';
UPDATE `messages` SET `body` = 'Bom dia, Artur. A equipe já iniciou a vistoria na Praça Central.' WHERE `id` = 'm-1';
UPDATE `notifications` SET `body` = 'Natália Cristina Pedrosa Cabral convidou você para o Comitê de Saúde Digital.' WHERE `id` = 'n-convite-saude';
UPDATE `notifications` SET `body` = 'Leila Cibeli Silveira Mendes convidou você para Operação Volta às Aulas 2026.' WHERE `id` = 'n-convite-volta-aulas';
UPDATE `notifications` SET `body` = 'Bruno Gonçalves da Fonseca enviou o Relatório técnico — Iluminação.pdf.' WHERE `id` = 'n-documento';
