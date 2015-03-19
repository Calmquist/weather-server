var express = require('express'); 
var https = require('https'); 
var http = require('http'); 
var fs = require('fs'); 
var url = require('url'); 
var bodyParser = require('body-parser');
var app = express(); 
var basicAuth = require('basic-auth-connect');
var auth = basicAuth(function(user, pass) {
    return((user === 'cs360') && (pass === 'test'));
});
var options = { 
    host: '127.0.0.1', 
    key: fs.readFileSync('ssl/server.key'), 
    cert: fs.readFileSync('ssl/server.crt') 
}; 
var ROOT_DIR = './root';
http.createServer(app).listen(80); 
https.createServer(options, app).listen(443); 

app.use('/', express.static('./root', {maxAge: 60*60*1000}));

app.get('/', function (req, res) { 
    res.send("Get Index"); 
});

app.get('/getcity', function (req, res) { 
    console.log("In REST Service.");
    var urlObj = url.parse(req.url, true, false);
    fs.readFile(ROOT_DIR + '/cities.dat.txt', function(err, data) {
        if(err) {throw err;}
        console.log(urlObj.query);
        var regEx = new RegExp("^" + urlObj.query["q"]);
        console.log(regEx);
        cities = data.toString().split("\n");
        var result = [];
        cities.forEach(function(elem) {
            if(elem.search(regEx) != -1) {
                console.log(elem);
                result.push({city:elem});
            }
        });
        console.log(JSON.stringify(result));
        res.writeHead(200);
        res.end(JSON.stringify(result));
    });
});

app.get('/comment', function (req, res) { 
    console.log("GET comment Route");
    console.log(req);
    var MongoClient = require('mongodb').MongoClient;
    MongoClient.connect("mongodb://localhost/comments", function(err,db) {
        if(err) {throw err;}
        db.collection("comments",function(err,comments) {
            comments.find(function(err, items) {
                items.toArray(function(err,itemArray){
                    console.log("Document Array: ");
                    console.log(itemArray);
                    res.writeHead(200);
                    res.end(JSON.stringify(itemArray));
                });
            });
        });
    });
}); 

app.post('/comment', auth, function (req, res) { 
    console.log("POST comment route");
    var jsonData = "";
    req.on('data', function (chunk) {
        jsonData += chunk;
    });
    req.on('end', function () {
        var reqObj = JSON.parse(jsonData);
        console.log(reqObj);
        console.log("Name: "+reqObj.Name);
        console.log("Comment: "+reqObj.Comment);
        var MongoClient = require('mongodb').MongoClient;
        MongoClient.connect("mongodb://localhost/comments", function(err,db) {
            if(err) {throw err;}
            db.collection("comments").insert(reqObj,function(err, records) {
                console.log("Record added as " + records[0]._id);
            });
        });
    });
    res.writeHead(204);
    res.end();
});
