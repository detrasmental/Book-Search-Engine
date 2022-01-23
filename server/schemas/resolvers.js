const { User, Book } = require("../models");
const { AuthenticationError } = require("apollo-server-express");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    // retrieve user by username
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({})
          .select("-__v -password")
          .populate("books");

        return userData;
      }

      throw new AuthenticationError("Not Signed In");
    },
  },

  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);

      return { token, user };
    },

    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      console.log(user, "user");

      if (!user) {
        console.log("error");
        throw new AuthenticationError("Authentication Error - no user found");
      }

      const correctPassword = await user.isCorrectPassword(password);

      if (!correctPassword) {
        console.log("password error");
        throw new AuthenticationError(
          "Authentication Error - invalid password"
        );
      }

      const token = signToken(user);
      return { token, user };
    },

    saveBook: async (parent, args, context) => {
      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: args.input } },
          { new: true }
        );

        return updatedUser;
      }

      throw new AuthenticationError("User must be logged in.");
    },

    removeBook: async (parent, args, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId: args.bookId } } },
          { new: true }
        );

        return updatedUser;
      }

      throw new AuthenticationError("User must be logged in.");
    },
  },
};

module.exports = resolvers;