const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
    const bookingsCollection = client.db("PMBIA").collection("bookings");

    // save user in db
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email: email };
      const options = { upsert: true };

      let updateDoc = {};
      if (user.name) {
        updateDoc.name = user.name;
      }
      if (user.image) {
        updateDoc.image = user.image;
      }
      if (user.email) {
        updateDoc.email = user.email;
      }
      if (user.gender) {
        updateDoc.gender = user.gender;
      }
      if (user.contactNo) {
        updateDoc.contactNo = user.contactNo;
      }
      if (user.address) {
        updateDoc.address = user.address;
      }
      if (user.role) {
        updateDoc.role = user.role;
      }

      const result = await userCollection.updateOne(
        query,
        { $set: updateDoc },
        options
      );
      res.send(result);
    });

    // get user from db
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    // instructors api's--------------------------------------------------------------

    // get all instructors
    app.get("/instructors", async (req, res) => {
      const count = parseInt(req.query.count) || 0;
      const search = req.query.search;
      const query = search
        ? { role: "Instructor", name: { $regex: search, $options: "i" } }
        : { role: "Instructor" };
      const result = await userCollection.find(query).limit(count).toArray();
      res.send(result);
    });

    // get number of instructors
    app.get("/instructors/total", async (req, res) => {
      const query = { role: "Instructor" };
      const count = await userCollection.countDocuments(query);
      res.send({ totalInstructors: count });
    });

    // get top 6 instructors & get instructors with total students
    app.get("/instructors/top", async (req, res) => {
      const query = { role: "Instructor" };
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

    // get single instructor
    app.get("/instructor/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id), role: "Instructor" };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    // update instructors available seat
    app.put("/instructor/updateStudentCount", async (req, res) => {
      const { instructorId, classIndex } = req.body; 
      const query = { _id: new ObjectId(instructorId), role: "Instructor" };
      const instructor = await userCollection.findOne(query);    
      let classItem = instructor.classes[classIndex];    
      classItem.totalStudent += 1;    
      const update = { $set: { classes: instructor.classes } };    
      const result = await userCollection.updateOne(query, update);     
      res.send(result);
    });
    

    // classes api's------------------------------------------------------------------------------

    // get all classes
    app.get("/classes", async (req, res) => {
      const count = parseInt(req.query.count);
      const search = req.query.search;
      const query = { role: "Instructor" };
      const instructors = await userCollection.find(query).toArray();

      let classes = instructors.flatMap((instructor) => {
        const instructorName = instructor.name;
        const instructorId = instructor._id;
        return instructor.classes.map((classItem, classIndex) => ({
          ...classItem,
          instructorName,
          instructorId,
          classIndex,
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
      const query = { role: "Instructor" };
      const instructors = await userCollection.find(query).toArray();
      const totalClasses = instructors.reduce((total, instructor) => {
        return total + instructor.classes.length;
      }, 0);
      res.send({ totalClasses });
    });

    // get top 6 classes
    app.get("/classes/top", async (req, res) => {
      const query = { role: "Instructor" };
      const instructors = await userCollection.find(query).toArray();

      let allClasses = instructors.flatMap((instructor) => {
        const instructorName = instructor.name;
        const instructorImg = instructor.image;
        const instructorId = instructor._id;
        return instructor.classes.map((classItem) => ({
          ...classItem,
          instructorName,
          instructorImg,
          instructorId,
        }));
      });

      const sortedClasses = allClasses.sort(
        (a, b) => b.totalStudent - a.totalStudent
      );
      const topClasses = sortedClasses.slice(0, 6);
      res.send(topClasses);
    });

    // post a booking
    app.put("/book-class", async (req, res) => {
      const {
        studentId,
        instructorId,
        classIndex,
        paymentStatus,
        transactionId,
        date,
      } = req.body;

      const query = { _id: new ObjectId(instructorId), role: "Instructor" };
      const options = { upsert: true };
      const instructor = await userCollection.findOne(query);
      const selectedClass = instructor.classes[classIndex];
      const booking = {
        studentId: new ObjectId(studentId),
        instructorName: instructor.name,
        instructorId: instructor._id,
        "class-name": selectedClass.name,
        classImage: selectedClass.image,
        classFee: selectedClass.price,
        paymentStatus,
        classIndex,
        transactionId,
        date,
      };
      const updateDoc = { $set: booking };
      const result = await bookingsCollection.updateOne(
        {
          "class-name": selectedClass.name,
          studentId: new ObjectId(studentId),
          instructorId: new ObjectId(instructorId),
          classIndex,
        },
        updateDoc,
        options
      );
      res.send(result);
    });

    // get user bookings
    app.get("/book-class/:studentId", async (req, res) => {
      const { studentId } = req.params;
      const query = { studentId: new ObjectId(studentId) };
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    });

    // get a booking
    app.get("/book-class/:studentId/:itemId", async (req, res) => {
      const { studentId, itemId } = req.params;
      const query = {
        studentId: new ObjectId(studentId),
        _id: new ObjectId(itemId),
      };
      const booking = await bookingsCollection.findOne(query);
      res.send(booking);
    });

    // delete a booking
    app.delete("/book-class/:studentId", async (req, res) => {
      const { studentId } = req.params;
      const { instructorId, classIndex } = req.body;
      const query = {
        instructorId: new ObjectId(instructorId),
        classIndex,
        studentId: new ObjectId(studentId),
      };
      const result = await bookingsCollection.deleteOne(query);
      res.send(result);
    });

    // delete all bookings of a user
    app.delete("/booking/:studentId", async (req, res) => {
      const { studentId } = req.params;
      const query = {
        studentId: new ObjectId(studentId),
        paymentStatus: "unpaid",
      };
      const result = await bookingsCollection.deleteMany(query);
      res.send(result);
    });

    // create payment intent
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseFloat(price) * 100;
      if (!price) return;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
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
