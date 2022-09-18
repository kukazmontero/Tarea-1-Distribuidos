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
    console.log("Redis listo")
    console.log("-------------------------------------------------------------------------------------------------------------")
})
const redis_client2 = redis.createClient({
    url:"redis://redis2"
 });
 
 redis_client2.on('ready',()=>{
     console.log("Redis2 listo")
     console.log("-------------------------------------------------------------------------------------------------------------")
 })
 const redis_client3 = redis.createClient({
    url:"redis://redis3"
 });
 
 redis_client3.on('ready',()=>{
     console.log("Redis3 listo")
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
    const busqueda=req.query.q;
    (async () => {
        resp = false;
        let reply = await redis_client.get(busqueda);
        let reply2 = await redis_client2.get(busqueda);
        let reply3 = await redis_client3.get(busqueda);

        


            if(reply){
                console.log("Busqueda: "+busqueda)
                console.log("Encontrado en Caché 1!")
                console.log("Resultados:")
                console.log(reply)
                console.log("--------------------------------------------------------------------------------------------------------------------------------")
                resp = true
            }
            if(reply2){
                console.log("Busqueda: "+busqueda)
                console.log("Encontrado en Caché 2!")
                console.log("Resultados:")
                console.log(reply2)
                console.log("--------------------------------------------------------------------------------------------------------------------------------")
                resp = true

            }
            if(reply3){
                console.log("Busqueda: "+busqueda)
                console.log("Encontrado en Caché 3!")
                console.log("Resultados:")
                console.log(reply3)
                console.log("--------------------------------------------------------------------------------------------------------------------------------")
                resp = true

            }
            if(resp==true){
                res.status(200).json(JSON.stringify(reply)+JSON.stringify(reply2)+JSON.stringify(reply3))
            }
            else{
                console.log("Busqueda: "+busqueda)
                console.log("No se ha encontrado en Caché, Buscando en Postgres...")
                client.GetServerResponse({message:busqueda}, (error,items) =>{
                    if(error){
                        res.status(400).json(error);
                    }
                    else{
                        data = JSON.stringify(items)
                        let userObj = JSON.parse(data);


                        if (userObj['product']!=null){
                             aux1=[];
                             aux2=[];
                             aux3=[];
                            for (i in userObj['product']){
                                const x = parseInt(userObj['product'][i].id)

                            if(x<=100){
                                
                                data=userObj['product'][i]
                                aux=JSON.stringify(data)
                                aux1.push(aux)
                                //aux1 = aux1 + aux

                            }
                            else if(x<=400){
                                
                                data=userObj['product'][i]
                                aux=JSON.stringify(data)
                                aux2.push(aux)
                                //aux2 = aux2 + aux

                            }
                            else if(x<=500){

                                data=userObj['product'][i]
                                aux=JSON.stringify(data)
                                aux3.push(aux)
                                //aux3 = aux3 + aux
                            }
                            }
                            if(aux1){
                                //console.log(aux1)
                                redis_client.append(busqueda, JSON.stringify(aux1))
                            }
                            if(aux2){
                                //console.log(aux2)
                                redis_client2.append(busqueda, JSON.stringify(aux2))
                            }
                            if(aux3){
                                //console.log(aux3)
                                redis_client3.append(busqueda, JSON.stringify(aux3))
                            }

                            res.status(200).json(userObj['product']);

                        }
                        
            
                    } 
                });
            } 
    })();
}

module.exports={
 searchitems
}