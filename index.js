const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y70m6ei.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const userCollection = client.db("PMBIA").collection("users");

    // save user in db
    app.put('/users/:email', async(req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email: email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await userCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    // instructors api's--------------------------------------------------------------

    // get all instructors
    app.get("/instructors", async (req, res) => {
      const count = parseInt(req.query.count) || 0;
      const search = req.query.search;
      const query = search
        ? { role: "instructor", name: { $regex: search, $options: "i" } }
        : { role: "instructor" };
      const result = await userCollection.find(query).limit(count).toArray();
      res.send(result);
    });

    // get number of instructors
    app.get("/instructors/total", async (req, res) => {
      const query = { role: "instructor" };
      const count = await userCollection.countDocuments(query);
      res.send({ totalInstructors: count });
    });

    // get top 6 instructors & get instructors with total students
    app.get("/instructors/top", async (req, res) => {
      const query = { role: "instructor" };
      const instructors = await userCollection.find(query).toArray();

      const instructorsWithTotalStudents = instructors.map((instructor) => {
        const totalStudents = instructor.classes.reduce(
          (total, classItem) => total + classItem.totalStudent,
          0
        );
        return { ...instructor, totalStudents };
      });

      const sortedInstructors = instructorsWithTotalStudents.sort(
        (a, b) => b.totalStudents - a.totalStudents
      );

      const topInstructors = sortedInstructors.slice(0, 6);

      res.send({ topInstructors, instructorsWithTotalStudents });
    });

    // classes api's------------------------------------------------------------------------------

    // get all classes
    app.get("/classes", async (req, res) => {
      const count = parseInt(req.query.count);
      const search = req.query.search;
      const query = { role: "instructor" };
      const instructors = await userCollection.find(query).toArray();

      let classes = instructors.flatMap((instructor) => {
        const instructorName = instructor.name;
        return instructor.classes.map((classItem) => ({
          ...classItem,
          instructorName,
        }));
      });

      if (search) {
        classes = classes.filter((classItem) =>
          classItem.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      classes = classes.slice(0, count);

      res.send(classes);
    });

    // get number of classes
    app.get("/classes/total", async (req, res) => {
      const query = { role: "instructor" };
      const instructors = await userCollection.find(query).toArray();
      const totalClasses = instructors.reduce((total, instructor) => {
        return total + instructor.classes.length;
      }, 0);
      res.send({ totalClasses });
    });
    
    // get top 6 classes
    app.get("/classes/top", async (req, res) => {
      const query = { role: "instructor" };
      const instructors = await userCollection.find(query).toArray();  
      
      let allClasses = instructors.flatMap((instructor) => {
        const instructorName = instructor.name;
        const instructorImg = instructor.image;
        return instructor.classes.map((classItem) => ({
          ...classItem,
          instructorName,
          instructorImg
        }));
      });
  
      const sortedClasses = allClasses.sort((a, b) => b.totalStudent - a.totalStudent);  
      const topClasses = sortedClasses.slice(0, 6);   
      res.send(topClasses);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send(`PMBIA server is active on port: ${port}`);
});

app.listen(port, () => {
  console.log(`PMBIA server is running on port: ${port}`);
});
