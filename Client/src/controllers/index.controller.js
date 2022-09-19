const grpc = require("@grpc/grpc-js");
const PROTO_PATH = "./src/controllers/searchInventory.proto"
var redis = require('redis')
var protoLoader = require("@grpc/proto-loader");

const options = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
};

const redis_client = redis.createClient({
   url:"redis://redis1"
});

redis_client.on('ready',()=>{
    console.log("Redis 1 listo")
    console.log("-------------------------------------------------------------------------------------------------------------")
})
const redis_client2 = redis.createClient({
    url:"redis://redis2"
 });
 
 redis_client2.on('ready',()=>{
     console.log("Redis 2 listo")
     console.log("-------------------------------------------------------------------------------------------------------------")
 })
 const redis_client3 = redis.createClient({
    url:"redis://redis3"
 });
 
 redis_client3.on('ready',()=>{
     console.log("Redis 3 listo")
     console.log("-------------------------------------------------------------------------------------------------------------")
 })

redis_client.connect()
redis_client2.connect()
redis_client3.connect()

console.log('Redis 1 conection: '+redis_client.isOpen);
console.log('Redis 2 conection: '+redis_client2.isOpen);
console.log('Redis 3 conection: '+redis_client3.isOpen);

var packageDefinition = protoLoader.loadSync(PROTO_PATH, options);

const InventorySearch= grpc.loadPackageDefinition(packageDefinition).InventorySearch;

const client = new InventorySearch(
    "grpc_server:50051",
    grpc.credentials.createInsecure()
  );

const searchitems=(req,res)=>{
    const busqueda=req.query.q
    let cache = null;
    let cache2 = null;
    let cache3 = null;
    (async () => {
        let reply = await redis_client.get(busqueda);
        let reply2 = await redis_client2.get(busqueda);
        let reply3 = await redis_client3.get(busqueda);

        if(reply){
            
            cache = JSON.parse(reply);
            console.log("Busqueda: "+busqueda)
            console.log("Encontrado en Cache 1")
            console.log("Resultados:")

            console.log(cache)
            console.log("--------------------------------------------------------------------------------------------------------------------------------")


            res.status(200).json(cache)
        }else if(reply2){
            cache2 = JSON.parse(reply2);
            
            console.log("Busqueda: "+busqueda)
            console.log("Encontrado en Cache 2")
            console.log("Resultados:")
            console.log(cache2)

            console.log("--------------------------------------------------------------------------------------------------------------------------------")

            res.status(200).json(cache2)
        }else if(reply3){
            cache3 = JSON.parse(reply3);
            console.log("Busqueda: "+busqueda)
            console.log("Encontrado en Cache 3")
            console.log("Resultados:")

            console.log(cache3)
            console.log("--------------------------------------------------------------------------------------------------------------------------------")


            res.status(200).json(cache3)
        }
        else{
            console.log("Busqueda: "+busqueda)
            console.log("No se ha encontrado en Cache, Buscando en Postgres...")
            client.GetServerResponse({message:busqueda}, (error,items) =>{
            if(error){
                res.status(400).json(error);
            }
            else{
                data = JSON.stringify(items)
                if (data['product']!==null){
                    dato = JSON.parse(data)
                    string_total = ""
                    for (i in dato['product']){
                        var id=dato['product'][i].id
                        var title=dato['product'][i].title
                        var description=dato['product'][i].description
                        var keywords=dato['product'][i].keywords
                        var url=dato['product'][i].url
                        const stringsumar='id: '+id+' | title:'+title+' | description:'+description+' | keywords:'+keywords+' | url:'+url
                        string_total=string_total+stringsumar+'\n'
                    }
                    //Guardamos
                    partition = Math.floor(Math.random() * 3);
                    if(partition == 0){
                        console.log("guardado en cache 1")
                        redis_client.set(busqueda,JSON.stringify(string_total))
                    }else if(partition == 1){
                        console.log("guardado en cache 2")
                        redis_client2.set(busqueda,JSON.stringify(string_total))
                    }else{
                        console.log("guardado en cache 3")
                        redis_client3.set(busqueda,JSON.stringify(string_total))
                    }
                }
                res.status(200).json(dato);
            }
        })
        }
    })();
};

module.exports={
 searchitems
}