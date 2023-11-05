const express = require('express')
const cors = require('cors');
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pqcfxjd.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    const allJobsCollection = client.db('jobHubDB').collection('allJobs');

    //Inser data into database
    app.post('/api/v1/allJobs', async(req, res) => {
        const body = req.body;
        const result = await allJobsCollection.insertOne(body);
        res.send(result);
    })

    //get data from database
    app.get('/api/v1/allJobs', async(req, res) => {
        const result = await allJobsCollection.find().toArray()
        res.send(result);
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