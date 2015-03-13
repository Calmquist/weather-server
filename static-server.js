var fs = require('fs');
var http = require('http');
var url = require('url');
var ROOT_DIR = "./root";
var server = http.createServer(function (req, res) {
  var urlObj = url.parse(req.url, true, false);
  fs.readFile(ROOT_DIR + urlObj.pathname, function (err,data) {
    if(urlObj.pathname.indexOf("getcity") != -1) {
        // Execute the REST service
        console.log("In REST Service.");
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
    }
    else if (urlObj.pathname === "/comment") {
        console.log("comment route"); 
        if(req.method === "POST") { 
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
        }
        else if(req.method === "GET") {
            console.log("GET comment Route");
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
        }
    }
    else {
        // Serve static files
        if (err) {
          res.writeHead(404);
          res.end(JSON.stringify(err));
          return;
        }
    res.writeHead(200);
    res.end(data);
    }
  });
});

server.listen(80);

exports.server = server;

/*var options = {
    hostname: 'localhost',
    port: '80',
    path: '/hello.html'
  };
function handleResponse(response) {
  var serverData = '';
  response.on('data', function (chunk) {
    serverData += chunk;
  });
  response.on('end', function () {
    console.log(serverData);
  });
}
http.request(options, function(response){
  handleResponse(response);
}).end();*/
