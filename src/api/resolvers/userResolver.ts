import {GraphQLError} from 'graphql';
import {TokenContent, UserInput, UserOutput} from '../../types/DBTypes';
import fetchData from '../../functions/fetchData';
import {
  LoginResponse,
  MessageResponse,
  UserResponse,
} from '../../types/MessageTypes';
import {MyContext} from '../../types/MyContext';

// TODO: create resolvers based on user.graphql
// note: when updating or deleting a user don't send id to the auth server, it will get it from the token. So token needs to be sent with the request to the auth server
// note2: when updating or deleting a user as admin, you need to send user id (dont delete admin btw) and also check if the user is an admin by checking the role from the user object form context

const userResolver = {
  Query: {
    users: async (): Promise<UserOutput[]> => {
      if (!process.env.AUTH_URL) {
        throw new GraphQLError('Auth URL not set in .env file');
      }
      const users = await fetchData<UserOutput[]>(
        process.env.AUTH_URL + '/users',
      );
      users.forEach((user) => {
        user.id = user._id;
      });
      return users;
    },
    userById: async (
      _parent: undefined,
      args: {id: string},
    ): Promise<UserOutput> => {
      if (!process.env.AUTH_URL) {
        throw new GraphQLError('Auth URL not set in .env file');
      }
      const user = await fetchData<UserOutput>(
        process.env.AUTH_URL + '/users/' + args.id,
      );
      user.id = user._id;
      return user;
    },
    checkToken: async (
      _parent: undefined,
      _args: undefined,
      context: MyContext,
    ) => {
      const response = {
        message: 'Token is valid',
        user: context.userdata,
      };
      return response;
    },
  },
  Mutation: {
    login: async (
      _parent: undefined,
      args: {credentials: {username: string; password: string}},
    ): Promise<LoginResponse> => {
      if (!process.env.AUTH_URL) {
        throw new GraphQLError('Auth URL not set in .env file');
      }
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(args.credentials),
      };

      const LoginResponse = await fetchData<LoginResponse>(
        process.env.AUTH_URL + '/auth/login',
        options,
      );

      LoginResponse.user.id = LoginResponse.user._id;
      return LoginResponse;
    },
    register: async (
      _parent: undefined,
      args: {user: UserInput},
    ): Promise<UserResponse> => {
      if (!process.env.AUTH_URL) {
        throw new GraphQLError('Auth URL not set in .env file');
      }
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(args.user),
      };

      const registerResponse = await fetchData<
        MessageResponse & {data: UserOutput}
      >(process.env.AUTH_URL + '/users', options);
      registerResponse.data.id = registerResponse.data._id;

      return {message: registerResponse.message, user: registerResponse.data};
    },
    updateUser: async (
      _parent: undefined,
      args: {user: UserInput},
      context: MyContext,
    ): Promise<UserResponse> => {
      if (!process.env.AUTH_URL) {
        throw new GraphQLError('Auth URL not set in .env file');
      }
      if (!context.userdata) {
        throw new GraphQLError('User not authenticated');
      }

      const options = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + context.userdata.token,
        },
        body: JSON.stringify(args.user),
      };
      console.log('options', options);

      const response = await fetchData<MessageResponse & {data: UserOutput}>(
        process.env.AUTH_URL + '/users',
        options,
      );
      response.data.id = response.data._id;

      return {message: response.message, user: response.data};
    },
    deleteUser: async (
      _parent: undefined,
      _args: undefined,
      context: MyContext,
    ): Promise<UserResponse> => {
      if (!process.env.AUTH_URL) {
        throw new GraphQLError('Auth URL not set in .env file');
      }
      if (!context.userdata) {
        throw new GraphQLError('User not authenticated');
      }

      const user = context.userdata.user;

      const options = {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + context.userdata.token,
        },
      };

      const message = await fetchData<MessageResponse>(
        process.env.AUTH_URL + '/users',
        options,
      );

      user.id = user._id;

      return {message: message.message, user: user};
    },

    updateUserAsAdmin: async (
      _parent: undefined,
      args: {user: UserInput; id: string},
      context: MyContext,
    ): Promise<UserResponse> => {
      if (!process.env.AUTH_URL) {
        throw new GraphQLError('Auth URL not set in .env file');
      }
      console.log('context', context.userdata);
      if (!context.userdata) {
        throw new GraphQLError('User not authenticated');
      } else if (context.userdata.user.role !== 'admin') {
        console.log('context', context.userdata);
        throw new GraphQLError('User is not an admin');
      }

      const options = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + context.userdata.token,
        },
        body: JSON.stringify(args.user),
      };

      const response = await fetchData<MessageResponse & {data: UserOutput}>(
        process.env.AUTH_URL + '/users/' + args.id,
        options,
      );
      response.data.id = response.data._id;
      return {message: response.message, user: response.data};
    },

    deleteUserAsAdmin: async (
      _parent: undefined,
      args: {id: string},
      context: MyContext,
    ): Promise<UserResponse> => {
      if (!process.env.AUTH_URL) {
        throw new GraphQLError('Auth URL not set in .env file');
      }
      if (!context.userdata) {
        throw new GraphQLError('User not authenticated');
      } else if (context.userdata.user.role !== 'admin') {
        throw new GraphQLError('User is not an admin');
      }

      const user = await userResolver.Query.userById(_parent, {id: args.id});

      const options = {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + context.userdata.token,
        },
      };

      const message = await fetchData<MessageResponse>(
        process.env.AUTH_URL + '/users/' + args.id,
        options,
      );
      return {message: message.message, user: user};
    },
  },
};

export default userResolver;
