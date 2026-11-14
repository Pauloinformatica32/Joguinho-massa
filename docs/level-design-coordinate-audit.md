# Auditoria das coordenadas finais

## Checkpoints originais de buildMap()

| Região/andar | X | Nome |
| --- | --- | --- |
| Setor 9 | 310 | Abrigo da Chuva |
| Setor 9 | 1440 | Oficina do bloqueio |
| Industrial | 2570 | Gerador auxiliar |
| Industrial | 4380 | Manutenção de segurança |
| tower_floor_1 | 5390 | 01 · Segurança Corporativa · Abrigo |
| tower_floor_2 | 9090 | 02 · Laboratórios Secretos · Abrigo |
| tower_floor_3 | 13520 | 03 · Núcleo Central · Abrigo |
| Setor 9 | 680 | Subestação dos telhados |
| Industrial | 3330 | Oficina dos turnos |
| tower_floor_1 | 7050 | Arquivo de segurança |
| tower_floor_2 | 11200 | Observação dos laboratórios |
| tower_floor_3 | 13810 | Último abrigo / controle central |

## Checkpoints atuais

| ID | X | Região/andar | Motivo |
| --- | --- | --- | --- |
| s9-entry | 310 | 0 | Entrada e aprendizagem; retorno a Yara |
| s9-matrona | 1440 | 0 | Após os telhados, imediatamente antes de Matrona |
| factory-entry | 2570 | 1 | Entrada, montagem e retorno a Oren |
| factory-warden | 4380 | 1 | Após contenção, antes da arena de Warden |
| tower_floor_1-checkpoint | 5390 | tower_floor_1 | Entrada da torre |
| tower-security-mid | 7050 | tower_floor_1 | Entre as duas partições de segurança |
| tower_floor_2-checkpoint | 9090 | tower_floor_2 | Chegada do elevador |
| tower-lab-mid | 11200 | tower_floor_2 | Após a primeira barreira EMP, antes da segunda seção |
| tower_floor_3-checkpoint | 13810 | tower_floor_3 | Após a subida final, antes de Véspera |

## Plataformas de rota atuais (altura de colisão: 18 px)

| ID | X | Y | Largura | Rota |
| --- | --- | --- | --- | --- |
| s9-step | 180 | 690 | 260 | main |
| s9-balcony | 430 | 610 | 170 | main |
| s9-tutorial-roof | 820 | 580 | 270 | main |
| s9-log-roof | 1120 | 570 | 250 | main |
| s9-shortcut-west | 900 | 395 | 160 | optional |
| s9-shortcut-east | 1130 | 395 | 240 | main |
| s9-quarantine-ledge | 1220 | 215 | 150 | main |
| s9-antenna-lower | 950 | 110 | 230 | optional |
| s9-antenna-middle | 740 | -100 | 240 | optional |
| s9-antenna | 570 | -350 | 240 | optional |
| factory-loading | 2550 | 690 | 260 | main |
| factory-assembly | 2870 | 680 | 290 | main |
| factory-log | 3010 | 590 | 280 | main |
| factory-maintenance | 3300 | 650 | 200 | main |
| factory-coolant-west | 3380 | 550 | 160 | main |
| factory-coolant-east | 3740 | 550 | 220 | main |
| factory-service-west | 3890 | 590 | 120 | main |
| factory-service-east | 4090 | 590 | 280 | main |
| factory-crane-lower | 3460 | 310 | 260 | optional |
| factory-crane-middle | 3730 | 40 | 250 | optional |
| factory-crane | 3770 | -310 | 360 | optional |
| factory-turns-balcony | 2500 | 240 | 250 | optional |
| factory-turns-lower | 2640 | 440 | 230 | optional |
| security-entry | 5500 | 680 | 250 | main |
| security-west | 5780 | 565 | 250 | main |
| security-camera | 6080 | 455 | 240 | main |
| security-partition-west | 6280 | 565 | 260 | main |
| security-laser-bridge | 6680 | 675 | 290 | main |
| security-partition-east | 7200 | 565 | 500 | main |
| security-lift | 7850 | 680 | 280 | main |
| security-log | 6180 | 245 | 250 | optional |
| security-archive-lower | 6530 | 40 | 300 | optional |
| security-archive-upper | 6850 | -155 | 280 | optional |
| security-audit | 7150 | -315 | 360 | optional |
| lab-entry | 9110 | 675 | 260 | main |
| lab-west | 9420 | 560 | 280 | main |
| lab-partition-west | 9700 | 445 | 230 | main |
| lab-log | 9880 | 330 | 260 | main |
| lab-panel-approach | 10170 | 560 | 330 | main |
| lab-barrier-east | 10730 | 675 | 250 | main |
| lab-panel-return | 10240 | 675 | 220 | main |
| lab-east-approach | 11000 | 675 | 240 | main |
| lab-camera | 11200 | 445 | 220 | main |
| lab-partition-east | 11370 | 330 | 360 | main |
| lab-exit | 11750 | 560 | 140 | main |
| lab-lift | 12220 | 680 | 180 | main |
| lab-east-return | 11500 | 560 | 180 | main |
| lab-exit-return | 11650 | 675 | 240 | main |
| lab-employees | 10050 | 210 | 260 | optional |
| lab-consent-middle | 9730 | -40 | 260 | optional |
| lab-consent | 9850 | -315 | 320 | optional |
| core-step | 13070 | 680 | 230 | main |
| core-maintenance | 13230 | 570 | 240 | main |
| core-shaft-crossing | 13350 | 460 | 300 | main |
| core-terminal | 13550 | 350 | 240 | optional |
| core-descent | 13640 | 680 | 140 | main |
| core-map-middle | 13130 | 290 | 220 | optional |
| core-map | 13050 | 100 | 260 | optional |

As remoções e adições exatas estão em [level-platform-changes.csv](level-platform-changes.csv). Todas as âncoras antigas removidas e atuais, com origem/destino/função, estão em [level-anchor-changes.csv](level-anchor-changes.csv). Warden mantém posições, recarga e colisões anteriores.
