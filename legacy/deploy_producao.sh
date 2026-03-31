#!/bin/bash

# Constrói a imagem Docker para produção
docker build -t impacteai/transcrevezap:latest .

# Faz o push da imagem para o repositório
docker push impacteai/transcrevezap:latest


echo "Deploy de produção concluído."
