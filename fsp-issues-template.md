# Wiki Home Page
- [ ] Is the first page you see upon entering the wiki
- [ ] Contains a welcome message
- [ ] Contains a link/placeholder for a link to the live page
- [ ] All links in the right sidebar should contain each wiki page and link to the correct page
- [ ] Correctly formatted
  - [ ] each wiki page is listed in bullet points
  - [ ] all links route the correct page

---

# MVP List
- [ ] Should have 7 Features.
  - [ ] 3 of those are User Auth, Render, and Production README.
  - [ ] The other 4 are from the [MVP List](https://github.com/appacademy/curriculum/blob/master/full-stack-project/proposal/mvp-list.md) or they have clarified them with you
- [ ] Contains a description sentence of the app
- [ ] Includes two to three detailed bullets on functionality and presentation of feature
- [ ] At least one CRUD feature, which states what CRUD operations are planned (creation, reading, updating, deletion)
- [ ] Estimates how long it will take the code each MVP
- [ ] Correctly formatted
  - [ ] MVPs are listed in an ordered list
  - [ ] Each MVP is broken down into bullet points

---

# Database Schema
- [ ] Contains correct datatypes
- [ ] Contains appropriate constraints/details
  - [ ] primary key
  - [ ] not null
  - [ ] unique
  - [ ] indexed
  - [ ] foreign key
- [ ] Contains bullet points after the table that state which foreign keys will reference to which table, or references to the associations which will be made
 - [ ] foreign key and table name are lowercased, snake_cased and `back_ticked`
- [ ] Correctly formatted
  - [ ] schema is written in a table format
  - [ ] the table’s name are lowercased, snake_cased and `back_ticked`
  - [ ] the table header column names are bolded
  - [ ] columns names are lowercased and snaked_cased and `back_ticked`

---

# Sample State
- [ ] State shape is flat!
- [ ] State’s keys are camelCased
- [ ] All keys within the values in the state are accessible in the schema
- [ ] Correctly formatted
  - [ ] Sample state is rendered with triple backticks, and the language ` ```javascript...``` `). This will display the state as a code block instead of a giant line of text 
  - [ ] Top level slices
    - [ ] `entities`
    - [ ] `session`
    - [ ] `errors` (here or in `ui`)
    - [ ] `ui` (if needed)
  - [ ] Should NOT have nested slices, aka `comments` inside of `posts`
   + Some info from other tables is ok, for instance:
    + the author username and imageurl for a post. basically any info that the user can’t change
    + like count and a boolean on whether the user likes the post instead of a likes slice

---

# Backend Routes
- [ ] Contains the following sections: HTML, API Endpoints(Backend)
- [ ] Each route has a description
- [ ] API Endpoint routes contains wildcard variables written in `snake_case`
- [ ] Routes does not contain [superfluous routes](https://github.com/appacademy/curriculum/blob/master/rails/readings/routing-part-ii.md)
- [ ] Have API routes that will allow the front end to get all info it needs and does not have unneeded routes:
  + probably doesn’t need a `GET likes` api endpoint because that info comes through the post show

---

# Frontend Routes
- [ ] Frontend routes contains wildcard variables written in `camelCase`
- [ ] Correctly formatted
  - [ ] Routes are displayed with `inline coding text` (backticks)