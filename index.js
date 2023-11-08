const express = require('express')
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const app = express()

const port = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://job-hub-c6b58.web.app',
    'https://job-hub-c6b58.firebaseapp.com/'
  ],
  credentials:true
}))
app.use(express.json())
app.use(cookieParser())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pqcfxjd.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyToken = (req, res, next ) => {
  const token = req?.cookies?.token;
  console.log(token);
  if(!token){
    return res.status(401).send({message: 'Unaothorized access'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if(err){
      return res.status(401).send({message: 'Unaothorized access'})
    }
    req.user = decoded;
    next()
  })
}

async function run() {
  try {
    await client.connect();
    const allJobsCollection = client.db('jobHubDB').collection('allJobs');
    const applyedCollection = client.db('jobHubDB').collection('applyed');

    //jwt
    app.post('/jwt', async(req, res) => {
      const user = req.body;
// console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'1hr'})
      res.cookie('token',token, {
        httpOnly:true,
        secure: true,
        sameSite:'none',
      })
      .send({success: true})
    })
    

    //Inser data into database
    app.post('/allJobs', async(req, res) => {
        const body = req.body;
        const result = await allJobsCollection.insertOne(body);
        res.send(result);
    })

    //applied job post in database
    app.post('/applyed', async(req, res) => {
      const body = req.body;
      const result = applyedCollection.insertOne(body)
      res.send(result);
    })

    //get data from data base
    app.get('/applyed',verifyToken, async(req, res) => {
      let query = {}
      // console.log(req.query.email);
        const email = req.query.email;

        if(email){
            query = {email: email};
        }
        const result = await applyedCollection.find(query).toArray()
        res.send(result);
    })

    //get data from database
    app.get('/allJobs', async(req, res) => {
        let query = {}
        const email = req.query.email;
        if(email){
            query = {email: email};
        }
        const result = await allJobsCollection.find(query).toArray()
        res.send(result);
    })

    //get single Data operation
    app.get('/allJobs/:id', async(req, res) => {
        const id = req.params.id;
        
        const query = {_id: ObjectId(id)}
        const result = await allJobsCollection.findOne(query)
        res.send(result)

    })
    //get single data for applyed job operation
    app.get('/applyed/:id', async(req, res) => {
        const id = req.params.id;
        const query = {_id: ObjectId(id)}
        const result = await allJobsCollection.findOne(query)
        res.send(result)

    })

    //Update Jobs
    app.put('/allJobs/:id',async(req,res) => {
      const id = req.params.id;
      const data = req.body;
      const query = {_id: new ObjectId(id)}
      const option = {upsert: true}
      const UpdateData = {
        $set: {
          jobPhoto:data.jobPhoto,
          jobTitle:data.jobTitle,
          userName:data.userName,
          category:data.category,
          jobDescription:data.jobDescription,
          salary:data.salary,
          postingDate:data.postingDate,
          jobApplicantsNumber:data.jobApplicantsNumber,
          email:data.email,
          applicationDeadline:data.applicationDeadline
        }
      }
      const result = await allJobsCollection.updateOne(query, UpdateData, option);
      res.send(result)
    })

    //job patch
    app.patch('/allJobs/:id', async(req, res) => {
      const body = req.body;
      console.log(body);
    })

    //Delete Jobs
    app.delete('/allJobs/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await allJobsCollection.deleteOne(query)
      res.send(result)
    })

    //Delete applyed Jobs
    app.delete('/applyed/:id',verifyToken, async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await applyedCollection.deleteOne(query)
      res.send(result)
    })




    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Job Hub Server Is Running')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})