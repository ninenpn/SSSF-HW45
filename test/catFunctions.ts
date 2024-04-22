/* eslint-disable node/no-unpublished-import */
import request from 'supertest';
import {UploadResponse} from '../src/types/MessageTypes';
import {Application} from 'express';
import {CatTest, LocationInput, UserTest} from '../src/types/DBTypes';
require('dotenv').config();

// add test for graphql query
// before testing graphql, upload image to /api/v1/upload, parameter name: cat
// the file is test/picWithGPS.JPG
// the upload route will return JSON object:
/* {
  message: 'cat uploaded',
  data: {
    filename: string,
    location: geoJSON point,
  },
}
mutation CreateCat($cat_name: String!, $weight: Float!, $birthdate: DateTime!, $owner: ID!, $location: LocationInput!, $filename: String!) {
  createCat(cat_name: $cat_name, weight: $weight, birthdate: $birthdate, owner: $owner, location: $location, filename: $filename) {
    id
    cat_name
    weight
    birthdate
    owner {
      user_name
    }
    location {
      coordinates
      type
    }
    filename
  }
}
*/

const postFile = (
  url: string | Application,
  token: string,
): Promise<UploadResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .post('/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('cat', 'test/picWithGPS.JPG')
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const uploadMessageResponse = response.body;
          expect(uploadMessageResponse).toHaveProperty('message');
          expect(uploadMessageResponse).toHaveProperty('data');
          expect(uploadMessageResponse.data).toHaveProperty('filename');
          expect(uploadMessageResponse.data).toHaveProperty('location');
          expect(uploadMessageResponse.data.location).toHaveProperty(
            'coordinates',
          );
          expect(uploadMessageResponse.data.location).toHaveProperty('type');
          resolve(uploadMessageResponse);
        }
      });
  });
};

const postCat = (
  url: string | Application,
  vars: {input: CatTest},
  token: string,
): Promise<CatTest> => {
  console.log(vars);
  console.log(vars.input.location?.coordinates);
  return new Promise((resolve, reject) => {
    request(url)
      .post('/graphql')
      .set('Content-type', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .send({
        query: `mutation CreateCat($input: CatInput!) {
          createCat(input: $input) {
            birthdate
            cat_name
            filename
            weight
            owner {
              email
              user_name
              id
            }
            id
            location {
              coordinates
              type
            }
          }
        }`,
        variables: vars,
      })
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const cat = vars.input;
          const newCat: CatTest = response.body.data.createCat;
          expect(newCat).toHaveProperty('id');
          expect(newCat.cat_name).toBe(cat.cat_name);
          expect(newCat.weight).toBe(cat.weight);
          expect(newCat).toHaveProperty('birthdate');
          expect(newCat.owner).toHaveProperty('user_name');
          expect(newCat.location).toHaveProperty('coordinates');
          expect(newCat.location).toHaveProperty('type');
          expect(newCat.filename).toBe(cat.filename);
          resolve(newCat);
        }
      });
  });
};

// add test for graphql query
/*
query Query {
  cats {
    id
    cat_name
    weight
    location {
      coordinates
      type
    }
    filename
    birthdate
    owner {
      email
      id
      user_name
    }
  }
}
*/

const getCat = (url: string | Application): Promise<CatTest[]> => {
  return new Promise((resolve, reject) => {
    request(url)
      .post('/graphql')
      .set('Content-type', 'application/json')
      .send({
        query: `query Query {
          cats {
            id
            cat_name
            weight
            location {
              coordinates
              type
            }
            filename
            birthdate
            owner {
              email
              id
              user_name
            }
          }
        }`,
      })
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const cats = response.body.data.cats;
          expect(cats).toBeInstanceOf(Array);
          cats.forEach((cat: CatTest) => {
            expect(cat).toHaveProperty('id');
            expect(cat).toHaveProperty('cat_name');
            expect(cat).toHaveProperty('weight');
            expect(cat).toHaveProperty('location');
            expect(cat).toHaveProperty('filename');
            expect(cat).toHaveProperty('birthdate');
            expect(cat).toHaveProperty('owner');
            expect(cat.owner).toHaveProperty('email');
            expect(cat.owner).toHaveProperty('id');
            expect(cat.owner).toHaveProperty('user_name');
          });
          resolve(cats);
        }
      });
  });
};

// add test for graphql query
/*
query CatById($catByIdId: ID!) {
  catById(id: $catByIdId) {
    birthdate
    cat_name
    filename
    id
    location {
      type
      coordinates
    }
    owner {
      email
      id
      user_name
    }
    weight
  }
}
*/

const getSingleCat = (
  url: string | Application,
  id: string,
): Promise<CatTest> => {
  return new Promise((resolve, reject) => {
    request(url)
      .post('/graphql')
      .set('Content-type', 'application/json')
      .send({
        query: `query CatById($catByIdId: ID!) {
          catById(id: $catByIdId) {
            birthdate
            cat_name
            filename
            id
            location {
              type
              coordinates
            }
            owner {
              email
              id
              user_name
            }
            weight
          }
        }`,
        variables: {
          catByIdId: id,
        },
      })
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const cat = response.body.data.catById;
          expect(cat).toHaveProperty('id');
          expect(cat).toHaveProperty('cat_name');
          expect(cat).toHaveProperty('weight');
          expect(cat).toHaveProperty('location');
          expect(cat).toHaveProperty('filename');
          expect(cat).toHaveProperty('birthdate');
          expect(cat).toHaveProperty('owner');
          expect(cat.owner).toHaveProperty('email');
          expect(cat.owner).toHaveProperty('id');
          expect(cat.owner).toHaveProperty('user_name');
          resolve(cat);
        }
      });
  });
};

// add test for graphql query
/*
mutation UpdateCat($updateCatId: ID!, $cat_name: String, $weight: Float, $birthdate: DateTime) {
  updateCat(id: $updateCatId, cat_name: $cat_name, weight: $weight, birthdate: $birthdate) {
    birthdate
    cat_name
    weight
  }
}
*/

const userPutCat = (
  url: string | Application,
  vars: {input: CatTest; updateCatId: string},
  token: string,
): Promise<CatTest> => {
  return new Promise((resolve, reject) => {
    request(url)
      .post('/graphql')
      .set('Content-type', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .send({
        query: `mutation UpdateCat($updateCatId: ID!, $input: CatModify!) {
          updateCat(id: $updateCatId, input: $input) {
            cat_name
            birthdate
            weight
          }
        }`,
        variables: vars,
      })
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const cat = vars.input;
          const updatedCat = response.body.data.updateCat;
          expect(updatedCat.cat_name).toBe(cat.cat_name);
          expect(updatedCat.weight).toBe(cat.weight);
          expect(updatedCat).toHaveProperty('birthdate');
          resolve(updatedCat);
        }
      });
  });
};

const wrongUserPutCat = (
  url: string | Application,
  vars: {input: CatTest; updateCatId: string},
  token: string,
): Promise<CatTest> => {
  return new Promise((resolve, reject) => {
    request(url)
      .post('/graphql')
      .set('Content-type', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .send({
        query: `mutation UpdateCat($updateCatId: ID!, $input: CatModify!) {
          updateCat(id: $updateCatId, input: $input) {
            cat_name
            birthdate
            weight
          }
        }`,
        variables: vars,
      })
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const updatedCat = response.body.data.updateCat;
          expect(updatedCat).toBe(null);
          resolve(updatedCat);
        }
      });
  });
};

// add test for graphql query
/*
mutation DeleteCat($deleteCatId: ID!) {
  deleteCat(id: $deleteCatId) {
    id
  }
}
*/

const userDeleteCat = (
  url: string | Application,
  id: string,
  token: string,
): Promise<CatTest> => {
  return new Promise((resolve, reject) => {
    request(url)
      .post('/graphql')
      .set('Content-type', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .send({
        query: `mutation DeleteCat($deleteCatId: ID!) {
          deleteCat(id: $deleteCatId) {
            id
          }
        }`,
        variables: {
          deleteCatId: id,
        },
      })
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const deletedCat = response.body.data.deleteCat;
          expect(deletedCat.id).toBe(id);
          resolve(deletedCat);
        }
      });
  });
};

const wrongUserDeleteCat = (
  url: string | Application,
  id: string,
  token: string,
): Promise<CatTest> => {
  return new Promise((resolve, reject) => {
    request(url)
      .post('/graphql')
      .set('Content-type', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .send({
        query: `mutation DeleteCat($deleteCatId: ID!) {
          deleteCat(id: $deleteCatId) {
            id
          }
        }`,
        variables: {
          deleteCatId: id,
        },
      })
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const deletedCat = response.body.data.deleteCat;
          expect(deletedCat).toBe(null);
          resolve(deletedCat);
        }
      });
  });
};

// add test for graphql query
/*
query CatsByOwner($ownerId: ID!) {
  catsByOwner(ownerId: $ownerId) {
    birthdate
    cat_name
    filename
    id
    location {
      coordinates
      type
    }
    owner {
      user_name
      id
      email
    }
    weight
  }
}
*/

const getCatByOwner = (
  url: string | Application,
  id: string,
): Promise<CatTest[]> => {
  return new Promise((resolve, reject) => {
    request(url)
      .post('/graphql')
      .set('Content-type', 'application/json')
      .send({
        query: `query CatsByOwner($ownerId: ID!) {
          catsByOwner(ownerId: $ownerId) {
            birthdate
            cat_name
            filename
            id
            location {
              coordinates
              type
            }
            owner {
              user_name
              id
              email
            }
            weight
          }
        }`,
        variables: {
          ownerId: id,
        },
      })
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const cats = response.body.data.catsByOwner;
          cats.forEach((cat: CatTest) => {
            expect(cat).toHaveProperty('id');
            expect(cat).toHaveProperty('cat_name');
            expect(cat).toHaveProperty('weight');
            expect(cat).toHaveProperty('location');
            expect(cat).toHaveProperty('filename');
            expect(cat).toHaveProperty('birthdate');
            expect(cat).toHaveProperty('owner');
            expect(cat.owner).toHaveProperty('email');
            expect((cat.owner as UserTest).id).toBe(id);
            expect(cat.owner).toHaveProperty('id');
            expect(cat.owner).toHaveProperty('user_name');
          });
          resolve(cats);
        }
      });
  });
};

// add test for graphql query
/*
query CatsByArea($topRight: Coordinates!, $bottomLeft: Coordinates!) {
  catsByArea(topRight: $topRight, bottomLeft: $bottomLeft) {
    cat_name
    location {
      coordinates
      type
    }
  }
}
*/

const getCatByBoundingBox = (
  url: string | Application,
  location: LocationInput,
): Promise<CatTest[]> => {
  return new Promise((resolve, reject) => {
    request(url)
      .post('/graphql')
      .set('Content-type', 'application/json')
      .send({
        query: `query CatsByArea($topRight: Coordinates!, $bottomLeft: Coordinates!) {
          catsByArea(topRight: $topRight, bottomLeft: $bottomLeft) {
            cat_name
            location {
              coordinates
              type
            }
          }
        }`,
        variables: location,
      })
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const cats = response.body.data.catsByArea;
          cats.forEach((cat: CatTest) => {
            expect(cat).toHaveProperty('cat_name');
            expect(cat).toHaveProperty('location');
            expect(cat.location).toHaveProperty('coordinates');
            expect(cat.location).toHaveProperty('type');
          });
          resolve(cats);
        }
      });
  });
};

export {
  postFile,
  getCat,
  getSingleCat,
  postCat,
  userPutCat,
  userDeleteCat,
  wrongUserDeleteCat,
  wrongUserPutCat,
  getCatByOwner,
  getCatByBoundingBox,
};
