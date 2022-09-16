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
    url:"redis://redis"
});

redis_client.on('ready',()=>{
    console.log("Redis listo")
    console.log("-------------------------------------------------------------------------------------------------------------")
})

redis_client.connect()

console.log('Redis conection: '+redis_client.isOpen);


var packageDefinition = protoLoader.loadSync(PROTO_PATH, options);

const InventorySearch= grpc.loadPackageDefinition(packageDefinition).InventorySearch;

const client = new InventorySearch(
    "grpc_server:50051",
    grpc.credentials.createInsecure()
  );

const searchitems=(req,res)=>{
    const busqueda=req.query.q
    let cache = null;
    (async () => {
        let reply = await redis_client.get(busqueda);
            if(reply){
                cache = JSON.parse(reply);
                console.log("Busqueda: "+busqueda)
                console.log("Encontrado en Caché!")
                console.log("Resultados:")
                var string_total=""
                for (i in cache['product']){
                var id=cache['product'][i].id
                var title=cache['product'][i].title
                var description=cache['product'].description
                var keywords=cache['product'].keywords
                var url=cache['product'].url
                const stringsumar='id: '+id+' | title:' + title+' | description:'+description+' | keywords:'+keywords+' | url:'+url
                string_total=string_total+stringsumar+'\n'
                }
                console.log(string_total)
                console.log("--------------------------------------------------------------------------------------------------------------------------------")


                res.status(200).json(cache)
            }
            else{
                console.log("Busqueda: "+busqueda)
                console.log("No se ha encontrado en Caché, Buscando en Postgres...")
                client.GetServerResponse({message:busqueda}, (error,URLs) =>{
                    if(error){
                        
                        res.status(400).json(error);
                    }
                    else{
                        data = JSON.stringify(URLs)
                        if (data['product']!==null){
                        redis_client.set(busqueda,data)
                        res.status(200).json(URLs);}
                        

                        
            
                    }
                });
            } 
    })();
}





module.exports={
 searchitems
}