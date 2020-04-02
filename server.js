const https = require("https");
const fs = require('fs');
const express = require("express");
const cors = require("cors");
const PORT = process.env.PORT || 3000;
const parse = require('./parser');
const csvjson = require('csvjson');
const path = require("path");


// const { getLiveUpdates } = require('./lib/reddit.js');

const options = {
    headers: {
        'User-Agent': 'curl',
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + new Buffer('jhpersonal:29f3b565a34c5c4a11f59c7365e2b646eb4200dc').toString('base64'),
        json:true,
    }
};

const sourceUrl = 'https://api.github.com/repos/CSSEGISandData/COVID-19/contents/csse_covid_19_data/csse_covid_19_daily_reports';
let fileNames = [];
function getSource(url,n){
    var jsondata;
    new Promise((resolve,reject)=>{
        https.get(url+'/'+n,options,(res) => {
            let data = '';
            res.on('data',function(chunk){
            data += chunk;
        });
        res.on('end',() => {
                jsondata = JSON.parse(data);
                var csvdata = new Buffer(jsondata.content,'base64').toString('utf8');               
                jsondata = JSON.stringify(csvjson.toObject(csvdata));
               // console.log(jsondata);
                var filename = path.parse(n).name;  
               fs.writeFile('./source/'+filename+".json", jsondata, function (err) {

                    if (err) throw err;
            
                    console.log('It\'s saved!');
            
                });
                // console.log(jsondata);
            });        
    });
}); 

}


function getCSVFromRepo(){
    var jsondata;
    console.log('Inside'+sourceUrl);
    https.get(sourceUrl,options, (res) => {
        let data = '';
    
        // called when a data chunk is received.
        res.on('data', (chunk) => {
            data += chunk;
        });
    
        // called when the complete response is received.
        res.on('end', () => {
            var jsondata = JSON.parse(data);
            //console.log(jsondata);
            for(var i = 0; i < jsondata.length; i++) {
                var fname = jsondata[i].name;
                    console.log(fname);           
                if ( fname.indexOf('csv') > 0 ) {                  
                    fileNames.push(fname.replace('csv','json'));
                    getSource(sourceUrl,fname)   ;
                }
            }
        });
    
    }).on("error", (err) => {
        console.log("Error: ", err.message);
    });

}
function getAll(){
    let requests = [];
    fileNames.forEach(name=>{
        requests.push(getSource(sourceUrl,name))
    })
}

let finalData = [];
//getAll();
console.log("called");
getCSVFromRepo();

// Updates source csv files once every 12h
setInterval(()=>{
    getAll();
    
    console.log('data source updated.')
},43200000);

let app = express();

app.use(cors());

app.get("/all", (req, res) => {    
    let nametag ='';
    fileNames.forEach(name=>{
        var filename = path.parse(name).name;
        fs.readFile('./source/'+filename+".json", 'utf8',(err, data) => {
            if (err) throw err;
            //console.log(data);              
            nametag += data
       //     res.json(data);
          });        

    });
    console.log(nametag);
    res.json(nametag);
});

// app.get("/country/:id",(req,res)=>{
//     let id = Number(req.params.id);
//     if (id<1 || id>finalData.data.length) res.status(404);
//     res.json(finalData.data[id-1]);
// })

// app.get("/countries",(req,res)=>{
//     res.json(finalData.countries);
// })

app.listen(PORT, () => console.log(`express server is running on port ${PORT}`));
