var express = require("express");
var fs = require("fs");
var cors = require('cors')
const fileUpload = require('express-fileupload');
const { json } = require('body-parser');
const PATH = require("path");

// DB
const { Client } = require('pg')
var types = require('pg').types

const rootFilesDirectory = __dirname + "/files";

if (!fs.existsSync(rootFilesDirectory)) {
    fs.mkdirSync(rootFilesDirectory, { recursive: true });
}

var dbtableName = "documents";
var dbclient = null;
var dbColums = {
    id: "serial PRIMARY KEY",
    name: "TEXT",
    type: "TEXT",
    description: "TEXT",
    ocr: "TEXT",
    keywords: "TEXT",
    category: "TEXT",
    files: "TEXT",
    date: "DATE",
};


var queryDropTable = {
    text: `DROP TABLE IF EXISTS ` + dbtableName,
};
var queryCreateTable = {
    text: `CREATE TABLE ${dbtableName} (${Object.keys(dbColums).map((key, index, array) => {
        return `${key} ${dbColums[key]}`
    }).join(", ")})`,
    /*values:(Object.keys(dbColums).map((key,index,value)=> {
        return [key,dbColums[key]];
    })).flat()*/
}
var queryGetNewId = {
    text: `SELECT id from ${dbtableName} ORDER BY id DESC LIMIT 1`,
}
var queryGetFileInfos = {
    text: `SELECT * from ${dbtableName}`,
}
var queryGetFileInfo = {
    text: `select * from ${dbtableName} where id = $1`,
}
var querryNewFileInfo = {
    text: `INSERT INTO ${dbtableName} (${Object.keys(dbColums).map((key, index, array) => {
        return `$${index * 2}`
    }).join(", ")}) VALUES (${Object.keys(dbColums).map((key, index, array) => {
        return `$${index * 2 + 1}`
    }).join(", ")}) ON CONFLICT (id) DO UPDATE SET ${Object.keys(dbColums).map((key, index, array) => {
        return `$${index * 2} = $${index * 2 + 1}`
    }).join(", ")

        } WHERE id=$${Object.keys(dbColums).indexOf("id")}`,
    values: []
}
var queryDeleteFileInfo = {
    text: `DELETE FROM ${dbtableName} WHERE id=$1`,
    values: []
}
setupDB(false);

var server = express();
server.use(express.json());
server.use(express.text());
server.use(cors())
server.use(fileUpload({
    safeFileNames: true,
    preserveExtension: true
}));
server.use("/files", express.static(rootFilesDirectory));

server.use("/", express.static("page"));


function setupDB(createDB = false) {

    types.setTypeParser(types.builtins.DATE, function (val) {
        //console.log(val);
        return val;
    });


    dbclient = new Client({
        user: 'app-documentStorage',
        host: 'localhost',
        database: 'documents',
        password: 'app-documentStorage',
        port: 5432,
    })
    dbclient.connect()


    if (createDB) {

        dbclient.query(queryDropTable, (err, res) => {
            if (err) {
                console.error(queryDropTable)
                console.trace(err);

            }
        });
        // Create sql command to create new table
        /* var sql = "";
 
         sql += `CREATE TABLE ${dbtableName} (`;
 
         var keys = Object.keys(dbColums);
         keys.forEach(key => {
             sql += key + " " + dbColums[key] + ",";
         });
         sql = sql.substring(0,sql.length-1);
         sql += ")";
 
 
         sql = sql.replace("\n", "").replace("\r", "").replace("  ", " ").replace("\t", "");
 */

        dbclient.query(queryCreateTable, (err, res) => {
            if (err) {
                console.error(queryCreateTable)
                console.trace(err);
            }
        })
    }

}
function setupApi(server) {

    server.get("/api/newId", (req, res) => {
        getNewId().then((id) => {
            res.status(200).send(id.toString());
        }, (err) => {
            console.trace(err);
            res.status(500).send(err);
        })
    });
    server.get("/api/fileCount", (req, res) => {
        getTotalFilesCount().then((id) => {
            res.status(200).send(id.toString());
        }, (err) => {
            console.trace(err);
            res.status(500).send(err);
        })
    });

    server.get("/api/files", (req, res) => {
        getFileInfos(req.query).then((files) => {
            res.status(200).json(files);
        }, (err) => {
            console.trace(err);
            res.status(500).send(err);
        })
    });

    server.get("/api/files/:id", (req, res) => {
        var id = req.params.id;
        getFileInfo(id).then((file) => {
            res.status(200).send(file);
        }, (err) => {
            console.trace(err);
            res.status(500).send();
        })
    });
    server.post("/api/files", (req, res) => {
        postFileInfo(req.body).then((files) => {
            res.status(200).json(files);
        }, (err) => {
            console.trace(err);
            res.status(500).send();
        })
    });

    server.delete("/api/files/:id", (req, res) => {
        var id = req.params.id;
        //console.log(id);
        deleteFileInfo(id).then(() => {
            res.status(200).send();
        }, (err) => {
            console.trace(err);
            res.status(500).send();
        })
    });

    server.post("/api/files/:id/file", (req, res) => {
        var id = req.params.id;
        let file = req['files'].file;
        var fileName = file.name;
        postFile(id, fileName, file).then((file) => {
            res.status(200).send(file);
        }, (err) => {
            console.trace(err);
            res.status(500).send(err);
        })
    })
    server.get("/api/files/:id/:file", (req, res) => {
        var id = req.params.id;
        var fileName = req.params.file;
        getFile(id, fileName).then((filePath) => {
            res.sendFile(filePath);
        }, (err) => {
            console.trace(err);
            res.status(500).send(err);
        })
    })
    server.delete("/api/files/:id/:file", (req, res) => {
        var id = req.params.id;

        var fileName = req.params.file;
        deleteFile(id, fileName).then((file) => {
            res.status(200).send(file);
        }, (err) => {
            console.trace(err);
            res.status(500).send(err);
        })
    })

}


function appFileToDBFile(file) {
    var arraySeperator = "#;#";
    var dbFile = {};
    if (!file.id) {
        file.id = -1;
    }
    dbFile.id = file.id;
    if (!file.name) {
        file.name = "";
    }
    dbFile.name = file.name.replace("'", "");
    if (!file.type) {
        file.type = "";
    }
    dbFile.type = file.type.replace("'", "");
    if (!file.description) {
        file.description = "";
    }
    dbFile.description = file.description.replace("'", "");
    if (!file.ocr) {
        file.ocr = [];
    }
    dbFile.ocr = file.ocr.join(arraySeperator).replace("'", "");;
    if (!file.keywords) {
        file.keywords = [];
    }
    dbFile.keywords = file.keywords.join(arraySeperator).replace("'", "");
    if (!file.category) {
        file.category = [];
    }
    dbFile.category = file.category.join(arraySeperator).replace("'", "");

    if (!file.files) {
        file.files = [];
    }
    dbFile.files = file.files.join(arraySeperator).replace("'", "");

    dbFile.date = file.date;
    if (dbFile.date == undefined) {
        dbFile.date = null;
    }
    /*if (file.files && file.files.length > 0) {
        dbFile.filePaths = file.files.map((val) => { return val.path }).join(arraySeperator).replace("'", "");;
        //dbFile.fileCreated = file.files.map((val) => { return val.changed }).join(arraySeperator).replace("'", "");;
        //dbFile.fileChanged = file.files.map((val) => { return val.created }).join(arraySeperator).replace("'", "");;
    }
    else {
        dbFile.filePaths = "";
        dbFile.fileCreated = "";
        dbFile.fileChanged = "";
    }*/

    return dbFile;

}
function dbFileToAppFile(file) {
    var arraySeperator = "#;#";
    var appFile = {};
    appFile.id = file.id;
    appFile.name = file.name;
    appFile.type = file.type;
    appFile.description = file.description;
    if (file.ocr) {
        appFile.ocr = file.ocr.split(arraySeperator);
    }
    if (!appFile.ocr) {
        appFile.ocr = [];
    }
    if (file.keywords) {
        appFile.keywords = file.keywords.split(arraySeperator);
    }
    if (!appFile.keywords) {
        appFile.keywords = [];
    }
    if (file.category) {
        appFile.category = file.category.split(arraySeperator);
    }
    if (!appFile.category) {
        appFile.category = [];
    }
    if (file.files) {
        appFile.files = file.files.split(arraySeperator);
    }
    if (!appFile.files) {
        appFile.files = [];
    }
    if (file.date) {
        appFile.date = new Date(file.date);
    }
    //console.debug("dbFileToAppFile", file, "->", appFile);
    //console.debug("dbFileToAppFile", file.date, "->", appFile.date);

    return appFile;
}

function getNewId() {
    return new Promise((resolve, reject) => {
        var sql = `SELECT id from ${dbtableName} ORDER BY id DESC LIMIT 1`
        dbclient.query(sql, (err, res) => {
            if (err) {
                console.error(sql);
                console.trace(err);
                reject(err);
                return;
            }
            if (res.rows.length == 1) {
                resolve(res.rows[0].id + 1);
            }
            else {
                resolve(1);
            }
        });
    });
}

function getTotalFilesCount() {
    return new Promise((resolve, reject) => {
        var sql = `SELECT (reltuples / relpages * (pg_relation_size(oid) / 8192))::bigint FROM   pg_class WHERE  oid = '${dbtableName}'::regclass`
        dbclient.query(sql, (err, res) => {
            if (err) {
                console.error(sql);
                console.trace(err);
                reject(err);
                return;
            }
            if (res.rows.length == 1) {
                resolve(res.rows[0].id + 1);
            }
            else {
                resolve(1);
            }
        });
    });
}

function getFileInfos(filter) {
    return new Promise((resolve, reject) => {
        var sql = `SELECT * from ${dbtableName}`;
        var values = [];
        var arguments = "";
        if (filter.startDate) {
            var date = new Date(filter.startDate)
            values.push(`${date.toISOString()}`);
            arguments += ` date >= $${values.length} `
        }
        if (filter.endDate) {
            if (values.length > 0) {
                arguments += " AND "
            }
            var date = new Date(filter.endDate)
            values.push(`${date.toISOString()}`);
            arguments += ` date <= $${values.length} OR date is null`;
        }
        if (filter.name) {
            var words = filter.name.split(/( ,)/g);
            var calls = [];
            words.forEach(word => {
                values.push("%" + word + "%");
                calls.push(`name LIKE $${values.length}`);
            });
            arguments += calls.join(" AND ");
        }
        if (filter.description) {
            var words = filter.description.split(/( ,)/g);
            var calls = [];
            words.forEach(word => {
                values.push("%" + word + "%");
                calls.push(`description LIKE $${values.length}`);
            });
            arguments += calls.join(" AND ");
        }
        if (filter.keywords) {
            var words = filter.keywords.split(/( ,)/g);
            var calls = [];
            words.forEach(word => {
                values.push("%" + word + "%");
                calls.push(` keywords LIKE $${values.length}`);
            });
            arguments += calls.join(" AND ");
        }
        if (filter.id && filter.id >= 0) {
            values.push(filter.id);
            arguments += `id = $${values.length}`
        }
        if (arguments.length > 0) {
            sql += " WHERE " + arguments;
        }
        if (filter.count) {
            values.push(filter.count);
            sql += ` ORDER BY name LIMIT $${values.length}`;
        }
        if (filter.count && filter.offset) {
            values.push(filter.offset);
            sql += ` OFFSET $${values.length}`;
        }

        //console.debug(filter,sql,values);
        // `SELECT * from ${dbtableName}`
        dbclient.query(sql, values, (err, res) => {
            if (err) {
                console.trace(err);
                reject(err);
                return;
            }
            var files = [];
            res.rows.forEach(row => {
                files.push(dbFileToAppFile(row));
            });
            resolve(files);
        })
    });
}
function getFileInfo(id) {
    return new Promise((resolve, reject) => {
        if (!id || id == undefined || id == null) {
            reject("id is null");
            return;
        }
        var sql = "select * from " + dbtableName + " where id = $1"
        dbclient.query(sql, [id], (err, res) => {
            if (err) {
                console.log(err);
                reject(err);
                return;
            }
            if (res.rows.length == 1) {
                resolve(dbFileToAppFile(res.rows[0]));
            }
            else {
                reject("id not exist");
            }
        });




    });
}
function postFileInfo(file, withFiles = false) {
    return new Promise((resolve, reject) => {
        //console.log("postFileInfo", file)
        var dbfile = appFileToDBFile(file);
        if (!withFiles) {
            delete dbfile.files;
        }
        //console.debug(file);
        var values = [];
        var sql = "";
        if (dbfile.id >= 0) {
            var values = [];
            var sql = `INSERT INTO ${dbtableName} (${Object.keys(dbColums).join(", ")
                }) VALUES (${Object.keys(dbColums).map((key, index, array) => {
                    values.push(dbfile[key]);
                    return `$${index + 1}`
                }).join(", ")
                }) ON CONFLICT (id) DO UPDATE SET ${Object.keys(dbColums).map((key, index, array) => {
                    return `${key} = $${index + 1}`
                }).join(", ")
                } RETURNING *`;
        }
        else {
            var col = JSON.parse(JSON.stringify(dbColums));
            delete col.id;
            //console.log(col);
            sql = `INSERT INTO ${dbtableName} (${Object.keys(col).join(", ")
                }) VALUES (${Object.keys(col).map((key, index, array) => {
                    values.push(dbfile[key]);
                    return `$${index + 1}`
                }).join(", ")}) RETURNING *`;
        }
        //console.debug(sql, values);
        dbclient.query(sql, values, (err, res) => {
            if (err) {
                console.error(sql, values);
                console.trace(err);
                reject(err);
                return;
            }
            if (res.rows.length > 0) {
                var file = dbFileToAppFile(res.rows[0]);

                //console.debug("result",res.rows[0],"->",file);
                resolve(file);
            }
            else {
                var err = "nothing added"
                console.trace(err);
                reject(err);
            }
        });
        /*
            
            //console.debug(dbfile)
            if (file.id < 0 || file.id == undefined || file.id == null) {
                console.debug("create new");
                var sql = "";
                sql += `INSERT INTO ${dbtableName} (`;
    
    
                var keys = Object.keys(dbfile);
                keys = keys.filter((key) => { return key != "id" });
    
    
                sql += keys.join(",");
                sql += ") VALUES (";
                var values = Object.values(dbfile);
                sql += keys.map((key) => { return "'" + file[key] + "'" }).join(",");
                sql += ")";
    
                /*
                `INSERT INTO ${dbtableName} 
                ( name, type, description, ocr, keywords, category, filePaths, fileCreated, fileChanged)
                    VALUES (
                    '${name}',
                    '${type}',
                    '${description}',
                    '${ocr}',
                    '${keywords}',
                    '${category}',
                    '${filePaths}',
                    '${fileCreated}',
                    '${fileChanged}'
                    )` */
        /*
            console.debug(sql)
    dbclient.query(sql, (err, res) => {
        if (err) {
            console.log(err);
            reject(err);
            return;
        }

        dbclient.query(`select * from ${dbtableName} ORDER BY id DESC LIMIT 1`, (err1, res) => {
            if (err1) {
                console.log(err1);
                reject(err1);
                return;
            }
            if (res.rows.length == 1) {
                var file = dbFileToAppFile(res.rows[0]);

                resolve(file);
            }
        });
    })
}
else {
    //console.log("exist");

    var sql = `UPDATE ${dbtableName} SET `
    var keys = Object.keys(dbfile);
    keys = keys.filter((key) => { return key != "id" });
    sql += keys.map(key => { return `${key} = '${dbfile[key]}'` }).join(",");
    sql += `WHERE id = ${dbfile.id}`
    /*
    `UPDATE ${dbtableName} SET 
    name = '${name}', 
    type = '${type}', 
    description = '${description}', 
    ocr =  '${ocr}', 
    keywords = '${keywords}', 
    category = '${category}', 
    filePaths = '${filePaths}',
    fileCreated = '${fileCreated}', 
    fileChanged = '${fileChanged}'
    WHERE id = ${id}`
     *//*
       console.debug(sql)
       dbclient.query(sql, (err, res) => {
           if (err) {
               console.log(sql, err);
               reject(err);
               return;
           }
           resolve(file);
       });
   }*/
    });
}
function deleteFileInfo(id) {
    return new Promise((resolve, reject) => {

        if (id) {
            var sql = `DELETE FROM ${dbtableName} WHERE id=${id}`;
            dbclient.query(sql, (err, res) => {
                if (err) {
                    console.log(err);
                    reject(err);
                    return;
                }
                resolve();
            });
        }
    });
}


function getFileName(id, filename) {
    var name = "";
    if (!filename.includes("_+" + id)) {
        var nameSplit = filename.split(".");
        if (nameSplit.length >= 2) {
            nameSplit[nameSplit.length - 2] += "_+" + id;
        }
        else {
            nameSplit[0] += "_+" + id;
        }
        name = nameSplit.join(".");
    }
    else {
        name = filename;
    }
    return name;
}
function getNameFromFileName(filename) {
    var id = "";
    var filesplit = filename.split(".");
    if (filesplit.length >= 2) {
        var nameSplit2 = nameSplit[nameSplit.length - 2].split("_+");
        if (nameSplit2.length >= 2) {
            id = nameSplit2[nameSplit2.length - 2];
        }
    }
    else {
        var nameSplit2 = nameSplit[0].split("_+");
        if (nameSplit2.length >= 2) {
            id = nameSplit2[nameSplit2.length - 2];
        }
    }
    return id;
}
function getFile(id, filename) {
    return new Promise((resolve, reject) => {
        var path = getFileName(id, filename);
        var fullPath = rootFilesDirectory + "/" + path;
        fullPath = fullPath.replace("/", PATH.sep).replace("\\", PATH.sep);
        if (!fs.existsSync(fullPath)) {
            reject("file not exist");
            return;
        }
        resolve(fullPath);
    });
}
function postFile(id, filename, file) {
    return new Promise((resolve, reject) => {
        //console.debug("postFile")
        if (!id || id < 0 || id == undefined || id == null) {
            reject("id is " + id);
            return;
        }
        var path = getFileName(id, filename);
        var fullPath = rootFilesDirectory + "/" + path;

        fullPath = fullPath.replace("/", PATH.sep).replace("\\", PATH.sep);
        //console.debug(fullPath);
        var test = 20;

        /*if (fs.existsSync(fullPath)) {
            reject("image exist")
            return;
        }*/

        fs.writeFile(fullPath, file.data, (err) => {
            if (err) {
                console.trace(err);
                reject(err);
                return;
            }
            //console.log("RRRR", id,test)
            getFileInfo(id).then(fileInfo => {
                console.debug(fileInfo)
                fileInfo.files.push(path);
                //console.log("BBBB")

                postFileInfo(fileInfo, true);
                resolve(fileInfo);
            }, (err) => {
                var fileInfo = {};
                //fileInfo.id = id;
                fileInfo.files = [];
                fileInfo.files.push(path);
                postFileInfo(fileInfo).then((file) => {
                    resolve(file);
                }, (err) => {
                    console.trace(err);
                    reject(err);
                });

                //console.trace(err);

            });
        })
    });

}
function deleteFile(id, filename) {
    return new Promise((resolve, reject) => {
        var path = getFileName(id, filename);

        var fullPath = rootFilesDirectory + "/" + path;
        fullPath = fullPath.replace("/", PATH.sep).replace("\\", PATH.sep);
        //console.log(fullPath)
        if (!fs.existsSync(fullPath)) {
            //reject("file not exist");
            getFileInfo(id).then(fileInfo => {
                console.debug("deleteFile", fileInfo.files, filename, path)
                var index = fileInfo.files.findIndex(val => {
                    console.log(val.path == path, val.path, path)
                    return val == path;
                })
                if (index >= 0) {
                    fileInfo.files.splice(index, 1);
                }
                console.debug("deleteFile", fileInfo.files, filename, index, path)
                //console.debug(fileInfo);
                postFileInfo(fileInfo).then((file) => {
                    //console.debug(file);
                    resolve(file);
                });

            });
        }
        else {

            fs.rm(fullPath, (err) => {
                if (err) {
                    console.log(err);

                }
                getFileInfo(id).then(fileInfo => {
                    var index = fileInfo.files.findIndex(val => {
                        return val == path;
                    })
                    if (index >= 0) {
                        fileInfo.files.splice(index, 1);
                    }
                    postFileInfo(fileInfo);
                    resolve(fileInfo);
                });

            })
        }
    });
}

function createHistogramm() {
    return new Promise((resolve, reject) => {
        var histogrammTableName = "histogramm";
        var drop = `DROP TABLE IF EXISTS ${histogrammTableName}`
        var create = `CREATE TABLE ${histogrammTableName} (WordCount integer,KeyName text PRIMARY KEY)`;
        dbclient.query(drop, (err, res) => {
            if (err) {
                console.error(queryDropTable)
                console.trace(err);
            }
            dbclient.query(create, (err, res) => {
                if (err) {
                    console.error(queryDropTable)
                    console.trace(err);
                }
                console.debug("created Table " + histogrammTableName);
                var proms = [];
                getFileInfos({}).then((allFiles) => {
                    allFiles.forEach(allfile => {
                        //console.log(allfile);
                        proms.push(insertHistogrammText(histogrammTableName,allfile.name));
                        proms.push(insertHistogrammText(histogrammTableName,allfile.type));
                        proms.push(insertHistogrammText(histogrammTableName,allfile.tags));
                        proms.push(insertHistogrammText(histogrammTableName,allfile.description));
                        proms.push(insertHistogrammText(histogrammTableName,allfile.ocr));
                        proms.push(insertHistogrammText(histogrammTableName,allfile.keywords));
                        proms.push(insertHistogrammText(histogrammTableName,allfile.category));
                   /* */});
                    Promise.all(proms).then((results)=> {
                        resolve();
                    });
                });
            });
        });
    })
}

function insertHistogrammText(tableName,input) {
    return new Promise((resolve, reject) => {
        var text = "";
        if (Array.isArray(text)) {
            text = input.join(" ").toLowerCase();
        }
        else if (typeof(input)==typeof("")) {
            text = input.toLowerCase();
        }
        if (text) {
            var upsert = `INSERT INTO ${tableName} (KeyName,WordCount) VALUES ($1, $2) ON CONFLICT (KeyName) DO UPDATE SET WordCount=${tableName}.WordCount+1 WHERE ${tableName}.KeyName=$1`; //NOTHING`;//
            var words = text.split(/([ ,.\n\t])/gm);
            var proms = [];
            words.forEach(word => {
                if (word.length > 1) {
                    var values = [word, 1];
                    //console.debug(upsert,values)
                    proms.push(dbclient.query(upsert, values));
                }
            });
            Promise.all(proms).then((results)=> {
                resolve();
            },(err)=> {
                console.trace(err);
            });
    }
    });

}


setupApi(server);
server.get('*', function (req, res) {
    res.redirect("/index.html");
});

var port = 3000;
server.listen(port, () => {
    console.log(`PageBuilder server running at http://127.0.0.1:${port}`)
    //createHistogramm();
});