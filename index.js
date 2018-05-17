import amqp                           from "amqplib/callback_api";
import async                          from "async";
import mongoose                       from "mongoose";
import {amqpUrl, mongodbUrl, mariaDBUrl} from "./common/config";
import mysql                          from 'mysql';
import HTMLParser                     from './HTMLParser';
import {wordCounter, wordSeparator}   from './keyword';
import { resolve } from "url";
import { throws } from "assert";
const readfile = require('fs-readfile-promise');

var parser = new HTMLParser();
/*
readfile('./fake/index.html').then(result => {
    return result.toString();
}).then(html => {
    return parser.getResults(html);
}).then(metas => {
    metas.forEach(meta => {
        meta.keywords = wordCounter(wordSeparator(meta.content));
    });
    return metas;
}).then(result => {
    console.log(result);
    debugger;
});
*/

//si vous souhaitez ne pas utiliser mongo / rabbit ou mariadb, il vous suffit d'ajouter "return callback(null)" au début de la fonction correspondante

function mongoGetByIdPromise(mongoCllection){
    return new Promise((resolve, reject) => {
        mongoCllection.findById(spiderResultId, function(fetchError, result) {
            console.log('sffsd');
            debugger;
            if(fetchError) {
                reject(fetchError);
                return;
            }

            resolve(result);
        });
    });
}

function getMsgId(msg) {
    let task;
    try {
        task = JSON.parse(msg.content.toString());
    }
    catch (e) {
        console.error("Can't parse msg", e);
        return;
    }

    console.log("New message : "+ JSON.stringify(task))
    return task._id
    if (!spiderResultId) {
        console.error("The message doen't contain the object id of mongo document.");
        ch.ack(msg);
        return;
    }
}

async.parallel({
        mongo : function (callback) {
            console.log("start mongo connection");
            mongoose.connect(mongodbUrl)
                    .then(() => {
                        console.log("mongo connected");
                        callback(null, true);
                    })
                    .catch(err => {
                        console.error("mongo connection failed", err);
                        callback(err);
                    });
        },
        rabbit: function (callback) {
            //connect to rabbitMQ
            console.log("start rabbitMQ connection");
            amqp.connect(amqpUrl, function (err, conn) {
                if (err) {
                    console.error("rabbitMQ connection failed");
                    return callback(err);
                }
                conn.createChannel(function (err, ch) {
                    if (!err) {
                        console.log("rabbitMQ connected");
                    }
                    else {
                        console.error("rabbitMQ connection failed");
                    }
                    callback(err, ch);
                });
            });
        },
        maria : function (callback) {
            console.log("start MariaDB connection");
            let connection;
            try {
                connection = mysql.createConnection(mariaDBUrl);
                console.log("MariaDb connected");
                callback(null, connection);
            } catch (e) {
                console.error("MariaDB connection failed", e);
                callback(e);
            }
        }
    },
    function (err, results) {
        if (err) {
            console.error(err);
            process.exit(1);
        }

        let ch = results.rabbit;

        //TODO changer ce nom, et me dire le nom de votre micro service, et quand vous voulez recevoir une tache
        let q = "ms-meta";
        ch.assertQueue(q, {durable: false, maxPriority: 100});

        //ici vous indiquez le nombre de taches en même temps au max
        ch.prefetch(10);

        console.log(" [*] Waiting for messages in %s. To exit kill me", q);
        ch.consume(q, function (msg) {
            var spiderResultId = getMsgId(msg);

            if(!spiderResultId){
                return;
            }

            mongoGetByIdPromise(spiderResultId)
                .catch(fetchError => {
                    throw new Error("Failed to fetch spider result for id "+ spiderResultId + ". Error : " + JSON.stringify(fetchError));

                })
                .then(result => {
                    if (!result) {
                        throw new Error("No spider result for id "+ spiderResultId + ".");
                    }
        
                    var html = result.html
                    if (!html) {
                        throw new Error("No spider html found in the spider result "+ JSON.stringify(result) + ".");
                    }
                    debugger;
                    return html;
                }).then(html => {
                    return parser.getResults(html);
                }).then(metas => {
                    metas.forEach(meta => {
                        meta.keywords = wordCounter(wordSeparator(meta.content));
                    });
                    return metas;
                }).then(result => {
                    console.log(result);
                    debugger;
                }).catch(err => {
                    if(err.toString().indexOf('Failed to fetch spider result for id') < 0) {
                        ch.ack(msg);
                    }
                    console.error(err);
                });
/*
            spider_result.findById(spiderResultId, function(fetchError, result) {
                
                debugger;

                //console.log("Found html in result "+ JSON.stringify(result));
                
    
                var results = parser.getResults();
    
                // var sql = new MySQLService()
                // sql.sendResults(results, function(){
                //     console.log("Success send all result in SQL.");
                //     ch.ack(msg);
                // }, function(error) {
                //     console.error("Failed send result to SQL "+ error + ".");
                //     ch.ack(msg);
                // });
                
            })


            //cette commande pour dire que vous avez finis votre tache en cours (comme une callback)
            ch.ack(msg);*/
        }, {noAck: false});
    });

