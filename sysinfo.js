var express = require('express'),
si = require('systeminformation'),
http = require("https");

var app = express();
var zdToken = ''; //Neess populating with active Zendesk API token to work.

function updateZDTicket(ticketID, b, cb){

var comment = {
  "ticket": {
  "comment": { "body": JSON.stringify(b,null, 2), "public": false },
  "status":  "open"
  }
};

  var options = {
    "method": "PUT",
    "hostname": "brandwatch.zendesk.com",
    "path": "/api/v2/tickets/" + ticketID + ".json",
    "headers": {
      "authorization": "Basic " + zdToken,
      "content-type": "application/json",
    }
  };

  callback = function(response) {
  var str = ''
  response.on('data', function(chunk){
    str += chunk
  });

  response.on('end', function(){
    cb(str)
    });
  };
  http.request(options, callback).end(JSON.stringify(comment, null, 2));
};


app.get('/getinfo/:ticketId', function (req, res) {
  console.log("Ticket Number:", req.params.ticketId);
  si.system(function(system){
    si.cpu(function(cpu){
      si.mem(function(ram){
        si.osInfo(function(os){
          si.graphics(function(graphics){
            si.inetChecksite('https://app.brandwatch.com/',function(Analytics){
              si.inetChecksite('https://audiences.brandwatch.com/',function(Audiences){
                si.inetChecksite('https://admin.vizia.brandwatch.com/', function(Vizia){
                  si.inetChecksite('https://enterprise.vizia.brandwatch.com/',function(ViziaHub){
                    var browser = JSON.parse(JSON.stringify(req.headers['user-agent']));
                    var a = [];
                    a.push({ system, cpu, ram, os, graphics, browser});
                    if(req.headers['x-forwarded-for']){
                      a.push(JSON.parse('{"proxy": "Yes"}'));
                    }else{
                      a.push(JSON.parse('{"proxy": "No"}'));
                    };
                    a.push({"BrandwatchAccessible":{Analytics,Audiences,Vizia, ViziaHub}});
                    

                    updateZDTicket(req.params.ticketId, a, function(r){
                      res.json(JSON.parse(r));
                    });
                  });
                });
              });
            });
          });
        })
      });
    });
  });
});

app.listen(3000, function () {
  console.log('test infogatherer listening on port 3000!');
});
