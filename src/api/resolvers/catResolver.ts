import {GraphQLError} from 'graphql';
import catModel from '../models/catModel';
import {Cat} from '../../types/DBTypes';
import {MyContext} from '../../types/MyContext';

// TODO: create resolvers based on cat.graphql
// note: when updating or deleting a cat, you need to check if the user is the owner of the cat
// note2: when updating or deleting a cat as admin, you need to check if the user is an admin by checking the role from the user object
// note3: updating and deleting resolvers should be the same for users and admins. Use if statements to check if the user is the owner or an admin

const catResolver = {
  Query: {
    catById: async (_parent: undefined, args: {id: string}): Promise<Cat> => {
      const cat = await catModel.findById(args.id).populate('owner');
      if (!cat) {
        throw new GraphQLError('Cat not found');
      }
      return cat;
    },
    cats: async (): Promise<Cat[]> => {
      return await catModel.find().populate('owner');
    },
    catsByArea: async (
      _parent: undefined,
      args: {
        topRight: {lat: number; lng: number};
        bottomLeft: {lat: number; lng: number};
      },
    ): Promise<Cat[]> => {
      const box = [
        [args.bottomLeft.lng, args.bottomLeft.lat],
        [args.bottomLeft.lng, args.topRight.lat],
        [args.topRight.lng, args.topRight.lat],
        [args.topRight.lng, args.bottomLeft.lat],
        [args.bottomLeft.lng, args.bottomLeft.lat],
      ];
      return await catModel
        .find({
          location: {
            $geoWithin: {
              $geometry: {
                type: 'Polygon',
                coordinates: [box],
              },
            },
          },
        })
        .populate('owner');
    },
    catsByOwner: async (
      _parent: undefined,
      args: {ownerId: string},
    ): Promise<Cat[]> => {
      return await catModel.find({ownerId: args.ownerId});
    },
  },
  Mutation: {
    createCat: async (
      _parent: undefined,
      args: {input: Omit<Cat, 'id'>},
      context: MyContext,
    ): Promise<Cat> => {
      if (!context.userdata) {
        throw new GraphQLError('User not authenticated', {
          extensions: {code: 'UNAUTHENTICATED'},
        });
      }
      args.input.owner = context.userdata.user._id;
      const newCat = await catModel.create(args.input);
      if (!newCat) {
        console.log('Cat not created');
        throw new GraphQLError('Cat not created');
      }
      console.log('newCat', newCat);
      try {
        const cat = await catModel.findById(newCat._id).populate('owner');

        if (!cat) {
          console.log('Cat not found');
          throw new GraphQLError('Cat not found');
        }
        console.log('cat');
        console.log(cat);
        return cat;
      } catch (error) {
        console.log('error', error);
      }
      return newCat;
    },
    updateCat: async (
      _parent: undefined,
      args: {id: string; input: Cat},
      contextValue: MyContext,
    ): Promise<Cat> => {
      if (!contextValue.userdata) {
        throw new GraphQLError('User not authenticated', {
          extensions: {code: 'UNAUTHENTICATED'},
        });
      }

      try {
        const catUser = await catModel.findById(args.id).populate('owner');
        if (!catUser) {
          throw new GraphQLError('Cat not found');
        } else if (
          catUser.owner.id !== contextValue.userdata.user._id &&
          contextValue.userdata.user.role !== 'admin'
        ) {
          throw new GraphQLError('User is not the owner of the cat');
        }

        const cat = await catModel
          .findByIdAndUpdate(args.id, args.input, {
            new: true,
          })
          .populate('owner');
        if (!cat) {
          throw new GraphQLError('Cat not updated');
        }
        return cat;
      } catch (error) {
        console.log('error', error);
      }
      return args.input;
    },
    deleteCat: async (
      _parent: undefined,
      args: {id: string},
      contextValue: MyContext,
    ): Promise<Cat> => {
      if (!contextValue.userdata) {
        throw new GraphQLError('User not authenticated', {
          extensions: {code: 'UNAUTHENTICATED'},
        });
      }

      const catUser = await catModel.findById(args.id).populate('owner');
      if (!catUser) {
        throw new GraphQLError('Cat not found');
      } else if (
        catUser.owner.id !== contextValue.userdata.user._id &&
        contextValue.userdata.user.role !== 'admin'
      ) {
        throw new GraphQLError('User is not the owner of the cat');
      }

      const cat = await catModel.findByIdAndDelete(args.id).populate('owner');
      if (!cat) {
        throw new GraphQLError('Cat not deleted');
      }
      return cat;
    },
  },
};

export default catResolver;
