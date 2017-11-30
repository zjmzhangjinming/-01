const express=require("express") // 基于Node.js 平台的 web 开发框架
const expressStatic=require('express-static')
const cookieParser=require("cookie-parser")
const cookieSession=require("cookie-session")
const bodyParser=require("body-parser")
const multer=require("multer")
const pathLib=require("path")
const fs=require('fs')
const consolidate=require("consolidate")
const mysql=require("mysql")
const common=require("./common/md5")
const db=mysql.createPool({host:'localhost',user:'root',password:'root',database:'tour'})
	//mysql.createPool：创建一个连接池	nodejs连接mysql之使用连接池pool
var server=express()
server.listen(8080)

//console.log(multer)
//1、解析cookie
server.use(cookieParser('kdjferooig4098409trgjlkd'))
//2、使用session
var arr=[]
for(let i=0;i<10000;i++){
	arr.push("zhw_"+Math.random())
}
server.use(cookieSession({
	name:'zhw',
	keys:arr,
	maxAge:10*60*1000
}))
//3、post数据

//get req.query
//post   req.body

server.use(bodyParser.urlencoded({extended:false}));

var obj=multer({dest:'./www/upload/'})
server.use(obj.any())
//1、输出什么东西
server.set('view engine','html')
//2、模板文件
server.set('views','./template')
//3、哪种模板引擎
server.engine('html',consolidate.ejs)
//4、接收用户请求

server.use("/admin",function(req,res,next){
	if(!req.session["admin_id"] && req.url!='/denglu'){
		res.redirect('/admin/denglu')
	}else{
		next()
	}
})
server.get("/admin/denglu",(req,res)=>{
	res.render("login.ejs")
})
server.post("/admin/denglu",(req,res)=>{
	var username=req.body.uname  // 接收登录的用户名和密码
	var upwd=req.body.upwd
	//连接数据库，进行查询，看看有没有这个用户名和密码
	//console.log(`SELECT * FROM amdin_table WHERE user="${username}"`)
	db.query(`SELECT * FROM amdin_table WHERE user="${username}"`,(err,data)=>{
		if(err){
			console.error(err)
			res.send("数据库错误").end()
		}else{
			if(data.length==0){
				res.send("没有这个用户").end()
			}else{
				if(data[0].password==common.md5(upwd)){
					req.session["admin_id"]=data[0].user
					res.redirect('/admin/nav')
				}else{
					res.send("密码错误").end()
				}
			}
		}
	})
})
server.get("/admin/nav",(req,res)=>{
	//console.log(req.query.act,"aaaa")
	switch(req.query.act){ //获取get传值
		case "xiugai":
			console.log(req.query.title,req.query.id)
			db.query(`UPDATE nav_table SET ntitle="${req.query.title}" WHERE nid=${req.query.id}`,(err,data)=>{
				if(err){
					res.send("修改不成功").end()
				}else{
					db.query("SELECT * FROM nav_table",(err,data)=>{
					if(err){
						res.send("获取数据错误").end()
					}else{
						res.render("admin_index.ejs",{navList:data})
					}
					})	
				}
			})
		break;
		case "del":
			db.query(`DELETE FROM nav_table WHERE nid=${req.query.id}`,(err,data)=>{
				if(err){
					res.status(500).send("删除失败").end()
				}else{
					db.query("SELECT * FROM nav_table",(err,data)=>{
					if(err){
						res.send("获取数据错误").end()
					}else{
						res.render("admin_index.ejs",{navList:data})
					}
					})	
				}
			})
		break;
		case "update":
			db.query(`SELECT * FROM nav_table WHERE nid=${req.query.id}`,(err,update)=>{
				if(err){
					console.error(err)
					res.send("修改错误").end()
				}else{
					db.query("SELECT * FROM nav_table",(err,data)=>{
					if(err){
						res.send("获取数据错误").end()
					}else{
						res.render("admin_index.ejs",{navList:data,update})
					}
					})	
				}
			})
		break;
		default:
			db.query("SELECT * FROM nav_table",(err,data)=>{
				if(err){
					res.send("获取数据错误").end()
				}else{
					res.render("admin_index.ejs",{navList:data})
				}
			})		
		break;
	}				
})
server.post("/admin/nav",(req,res)=>{
	var title=req.body.title
	if(title){
		db.query(`INSERT INTO nav_table (ntitle) values ("${title}")`,(err,data)=>{
			if(err){
				res.status(500).send("数据库执行失败").end()
			}else{
				res.redirect('/admin/nav')
			}
		})
	}else{
		res.send("没有要添加的数据").end()
	}
})
server.get("/getNav",(req,res)=>{
	db.query("SELECT * FROM  nav_table",(err,data)=>{
		if(err){
			console.error(err);
			res.send("请求错误").end()
		}else{
			res.send(data).end()
		}
	})
})
server.get("/getNews",(req,res)=>{
	db.query("SELECT * FROM  news_table",(err,data)=>{
		if(err){
			console.error(err);
			res.send("请求错误").end()
		}else{
			res.send(data).end()
		}
	})
})
server.get("/admin/news",(req,res)=>{
	db.query("SELECT * FROM news_table",(err,data)=>{
		if(err){
			console.error(err);
			res.send("读取新闻列表数据库错误").end()
		}else{
			res.render("admin_news.ejs",{data:data})
		}
	})
})
server.get("/admin/news/update",(req,res)=>{
	var id=req.query.id
	db.query(`SELECT * FROM news_table WHERE nid=${id}`,(err,data)=>{
		if(err){
			res.send("数据库读取错误").end()
		}else{
			if(data.length==0){
				res.send("没有这条数据").end()
			}else{
				res.render("news_update.ejs",{data})
			}
		}
	})
})

server.post("/admin/news/update",(req,res)=>{
	var title=req.body.title
	var oldfile=req.body.filename
	var id=req.body.id
	var description=req.body.description
	var newName=req.files[0].path+pathLib.parse(req.files[0].originalname).ext
//	console.log(req.files)
	var newfile=req.files[0].filename+pathLib.parse(req.files[0].originalname).ext
	fs.rename(req.files[0].path,newName,function(err){
		if(err){
			console.error(err)
			res.send("文件上传有误").end()
		}else{
			//console.log(title,description,req.files.length)
			if(!title || !description || req.files.length==0){
				res.send("您添加的数据不完整").end()
			}else{
				fs.unlink("./www/upload/"+oldfile,function(err){
					if(err){
						console.error(err)
						res.send("delete file err").end()
					}else{
						db.query(`UPDATE news_table SET ntitle="${title}",ndescription="${description}",nsrc="${newfile}"  WHERE nid=${id}`,(err,data)=>{
					if(err){
						console.error(err)
						res.send("数据库错误").end()
					}else{
						res.redirect("/admin/news")
					}
				})
					}
				})
				
			}
		}
	})
})



server.get("/admin/news/del",(req,res)=>{
	var id=req.query.id
	var pic=req.query.pic
	fs.unlink("./www/upload/"+pic,function(err){
		if(err){
			console.error(err)
			res.send("delete file err").end()
		}else{
			db.query(`DELETE FROM news_table  WHERE nid=${id}`,(err,data)=>{
				if(err){
					console.error(err)
					res.send("数据库错误").end()
				}else{
					res.redirect("/admin/news")
				}
			})
		}
	})
})
server.post("/admin/news",(req,res)=>{
	var title=req.body.title
	var description=req.body.description
	var newName=req.files[0].path+pathLib.parse(req.files[0].originalname).ext
//	console.log(req.files)
	var newfile=req.files[0].filename+pathLib.parse(req.files[0].originalname).ext
	fs.rename(req.files[0].path,newName,function(err){
		if(err){
			console.error(err)
			res.send("文件上传有误").end()
		}else{
			//console.log(title,description,req.files.length)
			if(!title || !description || req.files.length==0){
				res.send("您添加的数据不完整").end()
			}else{
				db.query(`INSERT INTO news_table (ntitle,ndescription,nsrc) values ("${title}","${description}","${newfile}")`,(err,data)=>{
					if(err){
						console.error(err)
						res.send("数据库错误").end()
					}else{
						res.redirect("/admin/news")
					}
				})
			}
		}
	})
})


//4、static数据
server.use(expressStatic('./www'))
