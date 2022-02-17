var express = require("express");
var fs = require("fs");
var cors = require('cors')
const fileUpload = require('express-fileupload');
const { json } = require('body-parser');
const { Client } = require('pg')
const PATH = require("path");

const rootFilesDirectory = __dirname + "/files";

if (!fs.existsSync(rootFilesDirectory)) {
    fs.mkdirSync(rootFilesDirectory, { recursive: true });
}

var dbtableName = "documents";
var dbclient = null;
var dbColums = {
    id:"serial PRIMARY KEY",
    name:"TEXT",
    type:"TEXT",
    description:"TEXT",
    ocr:"TEXT",
    keywords:"TEXT",
    category:"TEXT",
    files:"TEXT",
    date:"timestamp",
};


var queryDropTable = {
    text:`DROP TABLE IF EXISTS `+dbtableName,
};
var queryCreateTable = {
    text:`CREATE TABLE ${dbtableName} (${ Object.keys(dbColums).map((key,index,array)=> {
        return `$${index*2} $${index*2+1}`
    }).join(", ")})`,
    values:(Object.keys(dbColums).map((key,index,value)=> {
        return [key,dbColums[key]];
    })).flat()
}
var queryGetNewId = {
    text:`SELECT id from ${dbtableName} ORDER BY id DESC LIMIT 1`,
}
var queryGetFileInfos = {
    text:`SELECT * from ${dbtableName}`,
}
var queryGetFileInfo = {
    text:`select * from ${dbtableName} where id = $2::number`,
}
var querryNewFileInfo = {
    text:`INSERT INTO ${dbtableName} (${Object.keys(dbColums).map((key,index,array)=> {
        return `$${index*2}`
    }).join(", ")}) VALUES (${Object.keys(dbColums).map((key,index,array)=> {
        return `$${index*2+1}`
    }).join(", ")}) ON CONFLICT (id) DO UPDATE SET ${Object.keys(dbColums).map((key,index,array)=> {
        return `$${index*2} = $${index*2+1}`
    }).join(", ")

    } WHERE id=$${Object.keys(dbColums).indexOf("id")}`,
    values:[]
}
var queryDeleteFileInfo = {
    text:`DELETE FROM ${dbtableName} WHERE id=$1`,
    values:[]
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


function setupDB(createDB=false) {
    dbclient = new Client({
        user: 'app-documentStorage',
        host: 'localhost',
        database: 'documents',
        password: 'app-documentStorage',
        port: 5432,
    })
    dbclient.connect()


    if (createDB) {

        


        dbclient.query(queryDropTable);
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
            //console.log(err, res)

        })
    }

}
function setupApi(server) {
    
    server.get("/api/newId", (req, res) => {
        getNewId().then((id) => {
            res.status(200).send(id.toString());
        }, (err) => {
            res.status(500).send(err);
        })
    });

    server.get("/api/files", (req, res) => {
        getFileInfos(req.query).then((files) => {
            res.status(200).json(files);
        }, (err) => {
            res.status(500).send(err);
        })
    });

    server.get("/api/files/:id", (req, res) => {
        var id = req.params.id;
        getFileInfo(id).then((file) => {
            res.status(200).send(file);
        }, (err) => {
            res.status(500).send();
        })
    });
    server.post("/api/files", (req, res) => {
        postFileInfo(req.body).then((files) => {
            res.status(200).json(files);
        }, (err) => {
            res.status(500).send();
        })
    });

    server.delete("/api/files/:id", (req, res) => {
        var id = req.params.id;
        console.log(id);
        deleteFileInfo(id).then(() => {
            res.status(200).send();
        }, (err) => {
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
            res.status(500).send(err);
        })
    })

    server.delete("/api/files/:id/:file", (req, res) => {
        var id = req.params.id;

        var fileName = req.params.file;
        deleteFile(id, fileName).then((file) => {
            res.status(200).send(file);
        }, (err) => {
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
    if (dbFile.date == undefined ) {
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
    if (file.data) {
        appFile.date = new Date(file.date);
    }
   /* appFile.files = [];
    if (file.filepaths) {
        var paths = file.filepaths.split(arraySeperator);
        var fileCreated = file.filecreated.split(arraySeperator);
        var fileChanged = file.filechanged.split(arraySeperator);
        paths.forEach((path, index, arr) => {
            var fi = {};
            fi.path = path;
            if (index < fileCreated.length) {
                fi.created = fileCreated[index];
            }
            if (index < fileChanged.length) {
                fi.changed = fileChanged[index];
            }
            appFile.files.push(fi);
        });
    }
*/

    return appFile;
}

function getNewId() {
    return new Promise((resolve, reject) => {
        
        dbclient.query('SELECT id from ' + dbtableName + ' ORDER BY id DESC LIMIT 1', (err, res) => {
            if (err) {
                console.trace(err);
                reject(err);
                return;
            }
            if (res.rows.length == 1) {
                resolve(res.rows[0].id+1);
            }
        });
    });
}

function getFileInfos(filter) {
    return new Promise((resolve, reject) => {
        dbclient.query('SELECT * from $1::text',[dbtableName], (err, res) => {
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
        var sql = "select * from $1::text" + dbtableName +" where id = $2::number" + id;
        dbclient.query(sql, (err, res) => {
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
function postFileInfo(file) {
    return new Promise((resolve, reject) => {
       // console.log("postFileInfo")
        var dbfile = appFileToDBFile(file);
        console.debug(file);
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
             */
            console.debug(sql)
            dbclient.query(sql, (err, res) => {
                if (err) {
                    console.log(sql, err);
                    reject(err);
                    return;
                }
                resolve(file);
            });
        }
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
function getFile() {

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

function postFile(id, filename, file) {
    return new Promise((resolve, reject) => {
        //console.debug("postFile")
        if (!id || id < 0 || id == undefined || id == null) {
            reject("id is 0")
            return;
        }
        var path = getFileName(id, filename);
        var fullPath = rootFilesDirectory + "/" + path;

        fullPath = fullPath.replace("/", PATH.sep).replace("\\", PATH.sep);
        //console.debug(fullPath);
        var test = 20;

        if (fs.existsSync(fullPath)) {
            reject("image exist")
            return;
        }

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

                postFileInfo(fileInfo);
                resolve(fileInfo);
            }, (err) => {
                var fileInfo = {};
                //fileInfo.id = id;
                fileInfo.files = [];
                fileInfo.files.push(path);
                postFileInfo(fileInfo).then((file) => {
                    resolve(file);
                },(err)=> {
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
        var path = getFileName(id, filename);;

        var fullPath = rootFilesDirectory + "/" + path;
        fullPath = fullPath.replace("/", PATH.sep).replace("\\", PATH.sep);
        //console.log(fullPath)
        if (!fs.existsSync(fullPath)) {
            //reject("file not exist");
            getFileInfo(id).then(fileInfo => {
                console.debug("deleteFile",fileInfo.files,filename,path)
                var index = fileInfo.files.findIndex(val => {
                    console.log(val.path == path,val.path,path)
                    return val == path;
                })
                if (index >= 0) {
                    fileInfo.files.splice(index, 1);
                }
                console.debug("deleteFile",fileInfo.files,filename,index,path)
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

setupApi(server);
server.get('*', function (req, res) {
    res.redirect("/index.html");
});

var port = 3000;
server.listen(port, () => {
    console.log(`PageBuilder server running at http://127.0.0.1:${port}`)
});