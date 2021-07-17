<p align="center">
  <img src="https://res.cloudinary.com/dcv3epinx/image/upload/v1618904450/signoz-images/LogoGithub_sigfbu.svg" alt="SigNoz-logo" width="240" />

  <p align="center">Monitor your applications and troubleshoot problems in your deployed applications, an open-source alternative to DataDog, New Relic, etc.</p>
</p>

<p align="center">
    <img alt="License" src="https://img.shields.io/badge/license-MIT-brightgreen"> </a>
    <img alt="Downloads" src="https://img.shields.io/docker/pulls/signoz/frontend?label=Downloads"> </a>
    <img alt="GitHub issues" src="https://img.shields.io/github/issues/signoz/signoz"> </a>
    <a href="https://twitter.com/intent/tweet?text=Monitor%20your%20applications%20and%20troubleshoot%20problems%20with%20SigNoz,%20an%20open-source%20alternative%20to%20DataDog,%20NewRelic.&url=https://signoz.io/&via=SigNozHQ&hashtags=opensource,signoz,observability"> 
        <img alt="tweet" src="https://img.shields.io/twitter/url/http/shields.io.svg?style=social"> </a> 
</p>

##

SigNoz helps developers monitor applications and troubleshoot problems in their deployed applications. SigNoz uses distributed tracing to gain visibility into your software stack.

👉 You can see metrics like p99 latency, error rates for your services, external API calls and individual end points.

👉 You can find the root cause of the problem by going to the exact traces which are causing the problem and see detailed flamegraphs of individual request traces.

<!-- ![SigNoz Feature](https://signoz.io/img/readme_feature1.jpg) -->

![SigNoz Feature](https://res.cloudinary.com/dcv3epinx/image/upload/v1618904032/signoz-images/screenzy-1618904013729_clssvy.png)

<br /><br />

<img align="left" src="https://signoz-public.s3.us-east-2.amazonaws.com/Features.svg" width="50px" />

## Features:

- Application overview metrics like RPS, 50th/90th/99th Percentile latencies, and Error Rate
- Slowest endpoints in your application
- See exact request trace to figure out issues in downstream services, slow DB queries, call to 3rd party services like payment gateways, etc
- Filter traces by service name, operation, latency, error, tags/annotations.
- Aggregate metrics on filtered traces. Eg, you can get error rate and 99th percentile latency of `customer_type: gold` or `deployment_version: v2` or `external_call: paypal`
- Unified UI for metrics and traces. No need to switch from Prometheus to Jaeger to debug issues.

<br /><br />

<img align="left" src="https://signoz-public.s3.us-east-2.amazonaws.com/WhatsCool.svg" width="50px" />

## Why SigNoz?

Being developers, we found it annoying to rely on closed source SaaS vendors for every small feature we wanted. Closed source vendors often surprise you with huge month end bills without any transparency.

We wanted to make a self-hosted & open source version of tools like DataDog, NewRelic for companies that have privacy and security concerns about having customer data going to third party services.

Being open source also gives you complete control of your configuration, sampling, uptimes. You can also build modules over SigNoz to extend business specific capabilities

### Languages supported:

We support [OpenTelemetry](https://opentelemetry.io) as the library which you can use to instrument your applications. So any framework and language supported by OpenTelemetry is also supported by SigNoz. Some of the main supported languages are:

- Java
- Python
- NodeJS
- Go

You can find the complete list of languages here - https://opentelemetry.io/docs/

<br /><br />

<img align="left" src="https://signoz-public.s3.us-east-2.amazonaws.com/Philosophy.svg" width="50px" />

## Getting Started
  
  
### Deploy using docker-compose

Please follow the steps listed [here](https://signoz.io/docs/deployment/docker/) to install using docker-compose

The [troubleshooting instructions](https://signoz.io/docs/deployment/docker/#troubleshooting) may be helpful if you face any issues.
  
  
### Deploy in Kubernetes using Helm

Please follow the steps listed [here](https://signoz.io/docs/deployment/helm_chart) to install using helm charts
  

<br /><br />

<img align="left" src="https://signoz-public.s3.us-east-2.amazonaws.com/UseSigNoz.svg" width="50px" />

## Comparisons to Familiar Tools

### SigNoz and Prometheus

Prometheus is good if you want to do just metrics. But if you want to have a seamless experience between metrics and traces, then current experience of stitching together Prometheus & Jaeger is not great. 

Our goal is to provide an integrated UI between metrics & traces - similar to what SaaS vendors like Datadog provides - and give advanced filtering and aggregation over traces, something which Jaeger currently lack.

### SigNoz and Jaeger

Jaeger only does distributed tracing. SigNoz does both metrics and traces, and we also have log management in our roadmap.

Moreover, SigNoz has few more advanced features wrt Jaeger:

- Jaegar UI doesn’t show any metrics on traces or on filtered traces
- Jaeger can’t get aggregates on filtered traces. For example, p99 latency of requests which have tag - customer_type='premium'. This can be done easily on SigNoz

<br /><br />

<img align="left" src="https://signoz-public.s3.us-east-2.amazonaws.com/DevelopingLocally.svg" width="50px" />

## Documentation

You can find docs at https://signoz.io/docs/deployment/docker. If you need any clarification or find something missing, feel free to raise a GitHub issue with the label `documentation` or reach out to us at the community slack channel.

<br /><br />

<img align="left" src="https://signoz-public.s3.us-east-2.amazonaws.com/Contributing.svg" width="50px" />

## Community

Join the [slack community](https://app.slack.com/client/T01HWUTP0LT#/) to know more about distributed tracing, observability, or SigNoz and to connect with other users and contributors.

If you have any ideas, questions, or any feedback, please share on our [Github Discussions](https://github.com/SigNoz/signoz/discussions)
