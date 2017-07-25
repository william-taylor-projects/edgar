
<img src='icon.png' align='right' width='150' height='150' />

# Edgar

Edgar is a customizable Node server for running multiple apps in a single LightSail/EC2 instance. It is designed for performance and maximum safety to ensure uninterrupted server uptime and efficiency. It was built with Typescript, Express and a collection of Express middleware to ensure maximum performance and scalability. In production environments Edgar is deployed via PM2 where multiple instances can be launched if needed. 

## Overview

Edgar uses middleware such a **vhost** so I can serve multiples websites depending on the domain name is used to access the web server. It also uses the **compression** middleware to take advantage of gzip compression for maximum webpage serving performance. It is configured via JSON  that allows the user to point domains to a folder that will be served when the user reaches the web server. It also allows the user to specify server extensions if the user wishes to add additional routes to the Edgar express app instance. It is built in Typescript for maximum safety and is used in both my production and development Amazon infrastructure environments.

## Technology

* Typescript
* Express
* Commander
* Winston
* Vhost
* PM2

## License

MIT