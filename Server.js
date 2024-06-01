const { MongoClient, ObjectId } = require("mongodb");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(cors())
app.use(express.json({ limit: '100mb' }));
app.use('/images', express.static('Posts/Images'));
// Increase limit for raw payloads (e.g., images)
app.use(express.raw({ limit: '100mb', type: 'application/octet-stream' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const myip="192.168.1.41"
app.listen(3000,()=>{
  console.log("Server started")
})

app.post("/signUp", async function (req, res) {
  var email = req.body["email"];
  var userName = req.body["userName"];

  var pass = req.body["password"];

  var result = await checkEmail(email);

  if (result) {
    
    res.json("Email already exist"+result)
  }
  else
  {
    var id=await addAccount(email,userName,pass)
    res.status(201).json({id:id,userName:userName,dpLink:""})
  }

 
});


app.post("/addPersonalData", async function(req,res){
  var name=req.body['name'];
  var username=req.body['username']
  var dob=req.body['dob']
  var email=req.body['email']


  var result= await addPersonalData(name,username,dob,email)

  console.log(result);
  res.status(201).json("201 Added Succesful")

})


app.post("/login",async function(req,res){

  var email=req.body['email']
  var pass=req.body['password']

  var result=await checkEmail(email)

  if(result)
    {

      
        if(pass==result['password'])
          {
            var object={id:result['_id'],email:result['username'],dpLink:result['dpLink']}
            res.status(201).json({id:result['_id'],userName:result['username'],dpLink:result['dpLink']})
          }
          else
          {
            res.status(401).json("401 Password Incorrect")
          }
    }
    else
    {
      res.status(401).json("401 Account nopt found")
    }

})



app.post("/getPost",async function(req,res){
  var userId=req.body['userId']

  var result=await getPost(userId)

  if(result)
    {
      res.status(201).json(result)
    }
    else
    {
      res.status(400).json("Error")
    }
})


app.post('/addPost',async (req, res) => {

 // console.log('Form data:', req.body['data']);

  const binaryData = Buffer.from(req.body['data'], 'base64');
  var fileName=req.body['filename'].toString().replace("%","")
  
  // Write binary data to file
  fs.writeFile("./Posts/Images/"+fileName, binaryData, 'binary', (err) => {
    if (err) {
      console.error('Error saving image:', err);
    } else {
   
    }
  });

  await addPost(req.body['userId'],req.body['filetype'],"http://"+myip+":3000/images/"+fileName,req.body['location'],req.body['description'],0,[])
  res.send('File uploaded successfully');
});


app.post("/addLike",function(req,res){
  var postId=req.body['postId']
  var userId=req.body['userId']
  var option=req.body['option']
console.log(postId+"and"+userId+option)
  addLike(postId,userId,option);

  res.json("success")

})

app.post("/addComment",function(req,res){
  var postId=req.body['postId']
  var userName=req.body['userName']
  var dpLink=req.body['dpLink']
  var comment=req.body['comment']
  console.log(postId)
  addComment(postId,userName,dpLink,comment)
  res.json("addedd");

})


app.post("/getProfileData", async function(req,res){
  var userId=req.body['_id']
 

 var result= await getProfileData(userId)
 if(result)
  res.status(201).json(result);
else
res.status(400).json("error")
})


app.post("/getpeople", async function(req,res){
  
 

 var result= await getPeople()
 if(result)
  res.status(201).json(result);
else
res.status(400).json("error")
})


app.post("/addfollow", async function(req,res){
  
  var userId=req.body['myuserId']
  var thierUserId=req.body['thieruserId']

  var result= await addFollow(userId,thierUserId)
  if(result)
   res.status(201).json(result);
 else
 res.status(400).json("error")
 })
 

async function addFollow(myuserid,thieruserid)
{
  const client=new MongoClient("mongodb://localhost:27017")

  try{
    await client.connect();
    const db=client.db("Socio")

    const collection=db.collection("Users")
    console.log(myuserid+"and"+thieruserid)
    var reult = await collection.updateOne({_id:new ObjectId( myuserid) },{$push:{following:thieruserid}})
    var reult = await collection.updateOne({_id: new ObjectId(  thieruserid)},{$push:{followers:myuserid}})
    return reult
  
   
  }
  catch(e)
  {
    console.log(e)
  }
}

async function getProfileData(_id)
{
  const client=new MongoClient("mongodb://localhost:27017")

  try{
    await client.connect();
    const db=client.db("Socio")



 
    const profileCollection=db.collection("Users")
   var profileResult = await profileCollection.find({_id: new ObjectId(_id)})

  
   var data={...(await profileResult.toArray())[0]}


 


   const postCollection=db.collection("Posts")
   var postResult = await postCollection.find({userId: _id})

  
    data['posts']=(await postResult.toArray())
    console.log(data)
    return data
  }
  catch(e)
  {
    console.log(e)
  }
}



async function getPeople()
{
  const client=new MongoClient("mongodb://localhost:27017")

  try{
    await client.connect();
    const db=client.db("Socio")

    const collection=db.collection("Users")

   var reult = await collection.find()

   var datatosend=(await reult.toArray())
   return datatosend
  
   
  }
  catch(e)
  {
    console.log(e)
  }
}




async function addComment(mypostId,myuserName,mydpLink,mycomment)
{
  const client=new MongoClient("mongodb://localhost:27017")

  try{
    await client.connect();
    const db=client.db("Socio")

    const collection=db.collection("Posts")

   var reult = await collection.updateOne({_id: new ObjectId(mypostId)},{$push:{comments:{userName:myuserName,dpLink:mydpLink,comment:mycomment,reply:[]}}})
  
   
  }
  catch(e)
  {
    console.log(e)
  }
}



async function addLike(mypostId,myuserId,option)
{
  const client=new MongoClient("mongodb://localhost:27017")

  try{
    await client.connect();
    const db=client.db("Socio")

    const collection=db.collection("Posts")
    if(option=="like")
   var reult = await collection.updateOne({_id: new ObjectId(mypostId)},{$push:{likes:myuserId}})
   else
   var reult = await collection.updateOne({_id: new ObjectId(mypostId)},{$pull:{likes:myuserId}})
   
  }
  catch(e)
  {
    console.log(e)
  }
}






async function addPersonalData(myname,myusername,mydob,myemail)
{
  const client=new MongoClient("mongodb://localhost:27017")

  try{
    await client.connect();
    const db=client.db("Socio")

    const collection=db.collection("Users")

   var reult = await collection.updateOne({email:myemail},{$set:{name:myname,username:myusername,dob:mydob}})
   return reult
  }
  catch
  {
  
  }
}

async function addPost(myuserId,mymediaType,mymediaLink,mylocation,mydescription,mylikes,mycomment)
{
  const client=new MongoClient("mongodb://localhost:27017")
  try{

    await client.connect();
    const db=client.db("Socio")
    const collection=db.collection("Posts")
    var result=  await collection.insertOne({userId:myuserId,mediaType:mymediaType,mediaLink:mymediaLink,location:mylocation,description:mydescription,likes:[],comments:mycomment,date:Date().toString()})
    if(result)
      return true;
    else
    return false;
  }
  catch
  {

  }
}

async function getPost(userId)
{
  const client = new MongoClient("mongodb://localhost:27017");
  try{
    await client.connect();

    const db=client.db("Socio")
    const followcollection=db.collection("Users");
    console.log("userid"+userId)
    var following=await followcollection.find({_id: new ObjectId(userId.toString())},{following:true,_id:false})
    
    const myFollowers =  ( await following.toArray())[0].following

    console.log("My Followers:", myFollowers);
    var myfollowers=myFollowers


    const postCollection=db.collection("Posts")
    var data= await postCollection.find({userId:{$in:myfollowers}}).toArray()
   
    var tempData=[...data]

    for(var i=0;i<tempData.length;i++)
      {
        console.log("u id"+tempData[i]._id)
        var userData=await followcollection.find({_id: new ObjectId(tempData[i].userId.toString()) },{name:true,_id:false})
        console.log(JSON.stringify(userData))
        tempData[i]['userName']=(await userData.toArray())[0].name
      }
      console.log(data)

    return tempData

   
  }
  catch(e){
      console.log(e)
  }
}


async function addAccount(myemail,userName,mypassowrd)
{

  const client = new MongoClient("mongodb://localhost:27017");
  try{
    await client.connect();

    const db=client.db("Socio")
    const collection=db.collection("Users");

   var res= await collection.insertOne({username:userName,email:myemail,password:mypassowrd,followers:[],following:[],dpLink:""})
   return res.insertedId
  }
  catch{

  }
}

async function checkEmail(myemail) {
  const client = new MongoClient("mongodb://localhost:27017");

  try {
    await client.connect();
    console.log("Connected correctly to server");

    const db = client.db("Socio");
    const collection = db.collection("Users");

    const result = await collection.findOne({ email: myemail },{username:true,dpLink:true,_id:true})
    if (result) {
      /* result.forEach((docs,i)=>{
        console.log(docs)
      })*/
      return result;
    } else {
      return false;
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}


