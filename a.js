app.get('/classes', async (req, res) => {
    const instructors = await userCollection.find({ role: 'instructor' }).toArray();
    const classes = instructors.flatMap((instructor) => instructor.classes);
  
    let filteredClasses = classes;
    const search = req.query.search;
    if (search) {
      filteredClasses = filteredClasses.filter((class) =>
        class.name.toLowerCase().includes(search.toLowerCase())
      );
    }
  
    const count = parseInt(req.query.count);
    const slicedClasses = count ? filteredClasses.slice(0, count) : filteredClasses;
  
    res.send(slicedClasses);
  });
  