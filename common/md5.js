const crypto=require("crypto")
module.exports={
	md5:function(str){
		var obj=crypto.createHash("md5")
		obj.update(str)
		return obj.digest("hex")
	}
}

/*
1、module.exports 初始值为一个空对象 {}
2、exports 是指向的 module.exports 的引用
3、require() 返回的是 module.exports 而不是 exports
*/
