<h1> Tarea-1-Distribuidos </h1>

Para usar este software es necesario tener Docker y verificar si contamos con Docker Compose en nuestro dispositvo y un cliente API.

Luego iniciamos el software ubicandonos en el archivo Docker-compose.yml y ejecutando

```
$ docker compose up --build
```

Para verificar el funcionamiento de este, necesitamos ejecutar en un cliente API como postman o insonmia una request de tipo POST de a la siguiente dirección

```
http://localhost:3000/inventory/search?q=
```

Ingresando al final de esta URL el parametro a buscar.

Ejemplo:

```
http://localhost:3000/inventory/search?q=National
```
