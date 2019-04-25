# Desafio Dito Chat

Este repositório é referente a entrega da atividade **Desafio Dito Chat**, que consiste em utilizar o estado da arte para gerar o ambiente de produção de um repositório.

## Problemas a serem solucionados

- Disponibilização de um serviço front-end em React.js
- Disponibilização de um serviço backend em GOlang
- Disponibilização de um serviço Redis
- Atribuir melhores práticas de arquitetura e segurança em nuvem
- Utilização de ferramentas de integração e deploy contínuos

## Ambiente escolhido

Devido a qualidade da plataforma e alto nível de integração entre seus serviços, esta atividade irá utilizar o fornecedor **Amazon Web Services**. Todos os recursos criados terão Tags para diferenciação do escopo.

## Provisionamento de Infraestrutura

Vamos utilizar o [Terraform](https://www.terraform.io/) e o [CloudFormation](https://aws.amazon.com/pt/cloudformation/) para provisionamento da infraestrutura necessária do ambiente. Os códigos podem ser versionado e reutilizado de diversas maneiras. O CloudFormation será utilizado para suprir demandas mais específicas da infraestrutura da AWS.

**Este repositório possui SOMENTE o script para criação do recurso ELASTICACHE para o Redis!**

Para todos os outros recursos, iremos usar como referência, o excelente repositório do **[Matheus Fidelis](https://github.com/msfidelis)**, que vai nos ajudar nesta empreitada:
**[https://github.com/msfidelis/ecs-pipeline](https://github.com/msfidelis/ecs-pipeline)**. Afinal, não precisa reinventar a roda.

O código funciona perfeitamente para este caso de uso, e pode ser adataptado facilmente para o ECS com instâncias EC2.

__Execução dos scripts do Terraform__

Para execução dos scripts do terraform, é necessário abrir a linah de comando e executar *terraform init* configurar o Provider da AWS. Também é necessário definição de três variáveis de ambiente com as permissões de credenciais do IAM:

- AWS_ACCESS_KEY_ID="sua_access_key"
- AWS_SECRET_ACCESS_KEY="sua_secret_access_key"
- AWS_DEFAULT_REGION="sua_regiao"

**Este repositório irá conter SOMENTE a criação do recurso ELASTICACHE.**
Estes scripts podem ser unidos em módulos, para que a criação seja realizada toda de uma vez.

## Escolha da arquitetura de Serviços de Aplicação

Para os Serviços de Aplicação, foi escolhida a plataforma Docker, devido a alta flexibilidade de configuração de ambientes, imagens de pequeno tamanho, rápido deploy e isolação a nível processo.

> Também é possível entregar a solução *Serveless* com o serviço backend utilizado funções Lambda com uma API Websocket do API Gateway. O serviço do frontend ficaria hospedado num bucket do S3, atrás de uma distribuição do CloudFront. Porém esta solução requer mudanças no código fonte das aplicações, e não é constado como um problema a ser resolvido neste desafio.  

## Imagem Docker

__Aplicação Frontend: node:10-alpine__

__Aplicação Backend:  1.12.4-alpine3.9__

As imagens baseadas no Linux Alpine contém apenas recursos essenciais para execução do serviço, diminuindo a chance de vulnerabilidades e possui um menor tamanho lógico comparado a outras distribuições.
Estas variantes escolhidas vem com a plataforma já configurada pelo distribuidor oficial da linguagem, poupando tempo de configuração e compilação. 

## Orquestrador de Contêiners

O orquestrador do ambiente de produção será o AWS Elastic Container Service.

Pontos positivos:

- Curva de aprendizado menor do que a dos concorrentes
- Integração nativa com serviços da AWS
- Abstração da instância master, reduzindo manutenção e custos
- Diversas maneiras de configuração de logs nativas
- Possibilidade de atribuir uma Role IAM para cada tarefa
- Configuração da task dentro do próprio repositório.
- Documentação rica e atualizada
- Os recursos podem ser criados/destruídos pelo Terraform ou Ansible
- Com o *ECR*, elimina a necessidade de um registry privado para imagens docker

Pontos negativos:

- Nenhum suporte a plugins e add-ons da comunidade, somente ferramentas que utilizam o awscli ecs no background
- Difícil atualização de software e kernel das instâncias em caso de um novo release do Docker
- Não é possível realocar o conteiner em outras instâncias

[Documentação do ECS](https://docs.aws.amazon.com/ecs/index.html)

# Confirgurando o Ambiente de Produção

## Criação do repositório privado no ECR

O código do Terraform irá criar um repositório ECR que vai manter nossas imagens docker.

## Configuração das Task Definitions

As Task Definitions configuram como o ambiente do conteiner irá se comportar, como variáveis de ambiente, rede interna entre conteiners, portas, DNS, utilização de CPU e etc.

Para facilitar a configuração e manutenção do ambiente de produção da imagem docker, adicionei o arquivo "task-definition.json" à pasta config dos repositórios.

**A equipe de desenvolvimento pode alterar as configurações de ambiente do conteiner sem a intervenção da equipe de DevOps.**

Se necessário a declaração de algum dado sensivel, recomendo guardá-lo no AWS Systems Manager na opção *Parameter Store* com uma chave do AWS KMS. O ECS possui integração nativa com este serviço, e toda vez que lançar um novo conteiner, os segredos serão injetados durante o lançamento. Para maoires informações, siga este [tutorial](https://docs.aws.amazon.com/pt_br/AmazonECS/latest/developerguide/specifying-sensitive-data.html).

# Pipeline

## Source
__GitHub__
Utilizaremos a própria plataforma de repositório de código do desafio.

## Testes
__AWS CodeBuild__

O codebuild consegue executar comandos a partir do arquivo *buildspec-test.yml*, ele possui uma divisão de etapas que facilita o a realização de testes, uma vez que se algo der errado, o script sairá com output **exit 1** falhando imediatamente este estágio.

Se os testes tiverem sucesso na execução, o pipeline chamará o estágio de Build.

## Build
__AWS CodeBuild__

Benefícios:
- Possui integração nativa com o CodePipeline
- Permite estratégias de distribuição de deploy nos ambientes
- Consegue efetuar deploys em diversos serviços da AWS, como ECS, Lambda e CloudFormation
- Consegue efetuar deploys em instâncias On-premise
- Todo histórico de deploys e artefatos pode salvo no CloudWatch Logs e S3

O CodeBuild receberá o artefato "task-definition.json" atualizado e criará uma nova revisão com seus elementos atualizados.

## Deploy
__AWS CodeDeploy__

Na modalidade do ECS, somente é possível subistituir todos os conteiners da task no serviço de uma vez.
Porém, é possível configurar a modalidade **ECS Blue/Green Deploy** para redirecionar o tráfego dos conteiners antigos para os atualizados gradualmente, permitindo criar triggers no CloudWatch Events em caso de um aumento de erros 5XX na aplicação e dando um rollback no deploy.

Para que o CodeDeploy atualize a Task Definition, foi necessário a criação de uma função lambda que recebe o nome da Task por uma requisição a um endpoint do API Gateway retorna o número da última revisão. 

O arquivo *taskbuild.sh* vai associar o número da nova versão ao arquivo "AppSpec.json" fazendo com que CodeBuild inicie o deploy com a nova revisão.

## Gerenciamento do Pipeline
__AWS CodePipeline__

## Alertas para Mensageiros (Slack, Hangouts, etc...)

O CodePipeline permite que cada execução de etapas gere um alerta no CloudWatch Events, que pode invocar uma função lambda. Estes eventos possuem toda informação da etapa, e seria bem bacana se conseguíssemos dar estas informações aos desenvolvedores para acompanhamento do processo.

A função lambda irá utilizar os dados do evento e enviar uma requisição HTTP ao endpoint exposto do aplicativo de mensagem.

# Entrega de Conteúdo

## Distribuição global e CDN
__AWS CloudFront__

Utilizaremos o serviço CloudFront para a distribuição global.

## Disposição da Arquitetura
__AWS VPC__

Vamos presumir que já exista uma VPC com quatro subnets (duas pública e duas privadas) divididas igualmente em duas Zonas de Disponibilidade A e B.

O back-end da aplicação o ficará residente na subnets privadas, e o front-end em subnets públicas.

__AWS Elastic Application LoadBalancer__

Os LoadBalancers farão o controle de tráfego e health checks nas instâncias onde estão hospedados os conteiners. Cada Serviço do ECS pode ter somente um LoadBalancer. Com vários serviços em um cluster, é possível a utilização de vários loadbalancers.

> **Nota**: Para balanceamento de carga onde o fluxo das requisições voltam para o mesmo host, é necessário que as TaskDefinitions estejam no modo de rede *awsvpc*. Pois o Loadbalancer trabalhará com o IP da instância em vez do relacionamento padrão. Outro ponto a se ressaltar é que certas famílias e tipos de instâncias permitem poucas ENI (Elastic Network Interface). Dificultando o deploy de soluções dividindo o mesmo host.

Para contornar este problema de chamadas por IP, iremos utilizar os DNS e Descoberta de serviço.

## DNS e Service Discovery
__AWS Route53__

O Route53 é o serviço da AWS responsável por orquestrar os registros de DNS e Zonas de Hospedagem. Ele possui uma grande sinergia com os serviços do ECS. Uma vez que ele também trabalha com o registro automático de **namespaces** quando um serviço é criado dentro de um Cluster.
É extremamente barato e dispensa configuração incial. Uma solução poderosa comparada a outros players no mercado como Hashicorp Consul.

Ele possibilita a separação de Zonas de Hospedagem, onde você pode trazer seu domínio personalizado ou domínio privado e trabalhar com registros e subdomínios.

Para a URL do LoadBalancer do **frontend**, vamos criar um novo registro CNAME na domínio da Zona de Hospedagem **Pública** como:
**Nome:** chat.dito.com.br.
**Tipo:** A - Endereço IPV4
**Alias:** Sim
**Alvo do alias** URL do loadbalancer do frontend

Para a URL do LoadBalancer do **backend**, vamos criar um novo registro CNAME na domínio da Zona de Hospedagem **Privada** como:
**Nome:** backend.chat.local.
**Tipo:** A - Endereço IPV4
**Alias:** Sim
**Alvo do alias** URL do loadbalancer do backend

Após alguns minutos, toda requisição feita a estes nomes será enviada aos load balancers!

Se você queria descobrir o namespace utilizado pelo seu serviço, a lista completa estará na Zona de Hospedagem **local**.

## Armazenamento de Logs Centralizado
__AWS CloudWatch Logs__

- Serviço de armazenamento de Logs
- Alertas em caso de eventos atípicos

## Persistência de Dados 
__ElastiCache__

O serviço do Redis é necessário para execução da aplicação, para garantir elasticidade e disponibilidade escolhi o Elasticache. O cluster é totalmente gerenciado pela AWS.

Para a criação do Cluster, vá até a pasta config/terraform/elasticache e execute os comandos **terraform init**, **terraform plan** e **terraform apply** informando as variáveis necessárias para criação.

Para a URL do Elasticache do **backend**, vamos criar um novo registro CNAME na domínio da Zona de Hospedagem **Privada** como:
**Nome:** redis.server.local.
**Tipo:** A - Endereço IPV4
**Alias:** Sim
**Alvo do alias** URL do nó ElastiCache configurado

Após esta configuração, basta apontar o endereço **redis.server.local:6379** para a variável de ambiente referente ao servidor Redis.

## Configuração do Lambda

No caminho config/lambda existem dois arquivos:

- **lambda.js**: Código fonte da nossa função que irá acessar a lista de task definitions e retornar o número da última revisão
- **iam-role.json**: Permissão de execução necessária para a função lambda 

# Execução do Script

Para a execução do script que irá criar toda a infraestrutura, vamo realizar o clone do repositório do **[Matheus Fidelis](https://github.com/msfidelis)**:

**[https://github.com/msfidelis/ecs-pipeline](https://github.com/msfidelis/ecs-pipeline)**.

Basta adicionar as URLs que criamos no Route53 as variáveis de ambiente no arquivos **task-definitions.json** do repositório das aplicações **backend** e **frontend**.

Este script irá criar sempre uma nova VPC, **é necessário alterar dentro do módulo ecs/cluster.tf para sempre buscar a VPC e Subnets já existentes**. 

Também altere o arquivo **codepipeline.tf** do módulo pipeline para customizar as etapas do processo. É possível adicionar quantas etapas quiser. 

Para criar a etapa de testes, vamos adicionar um novo estágio como o abaixo:

stage {
    name = "Testes"

    action {
        name             = "Testes"
        category         = "Build"
        owner            = "AWS"
        provider         = "CodeBuild"
        version          = "1"
        input_artifacts  = ["SourceArtifact"]
        output_artifacts = ["BuildArtifacts"]

        configuration {
        ProjectName = "${var.cluster_name}-codebuild"
        }
    }
}

No arquivo do **codebuild.tf**, altere o nome do buildspec *buildspec-prod.yml*, copie e cole os arquivos **buildspec-prod.yml** e **buildspec-test.yml** para a pasta *modules/pipeline/templates*.

Adicione um novo arquivo chamado **codebuild-test.tf** a pasta *modules/pipeline* com o seguinte código:

data "template_file" "buildspec_test" {
  template = "${file("${path.module}/templates/buildspec-test.yml")}"

  vars {
    repository_url = "${var.repository_url}"
    region         = "${var.region}"
    cluster_name   = "${var.cluster_name}"
    container_name = "${var.container_name}"

    # subnet_id          = "${var.run_task_subnet_id}"
    security_group_ids = "${join(",",var.subnet_ids)}"
  }
}

resource "aws_codebuild_project" "app_build_test" {
  name          = "${var.cluster_name}-codebuild"
  build_timeout = "60"

  service_role = "${aws_iam_role.codebuild_role.arn}"

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type = "BUILD_GENERAL1_SMALL"

    // https://docs.aws.amazon.com/codebuild/latest/userguide/build-env-ref-available.html
    image           = "aws/codebuild/docker:17.09.0"
    type            = "LINUX_CONTAINER"
    privileged_mode = true
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "${data.template_file.buildspec_test.rendered}"
  }
}


## Execute o script do Terraform preenchendo as variáveis necessárias para execução!

Depois de finalizada a configuração do ambiente de produção, você terá:

- Um Cluster ECS
- Dois Application Load Balancers
- Dois repositórios ECR
- Um cluster do ElastiCache
- Um pipeline em execução pelo CodePipeline

**Acesse a aplicação pela URL da aplicação frontend para testar o ambiente completo.**

## Obrigado!