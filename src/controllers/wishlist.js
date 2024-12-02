const Products = require('../models/Product');
const Users = require('../models/User');
const { getUser } = require('../config/getUser');

const getWishlist = async (req, res) => {
  try {
    const user = await getUser(req, res);
    //  Fetch wishlist and related products
    const wishlist = user.wishlist;
    const products = await Products.aggregate([
      {
        $match: {
          _id: { $in: wishlist }, // Match products with IDs present in the Pids array
        },
      },
      {
        $lookup: {
          from: 'productreviews',
          localField: 'reviews',
          foreignField: '_id',
          as: 'reviews',
        },
      },
      {
        $addFields: {
          averageRating: { $avg: '$reviews.rating' },
          image: { $arrayElemAt: ['$images', 0] },
        },
      },
      {
        $project: {
          image: { url: '$image.url', blurDataURL: '$image.blurDataURL' },
          name: 1,
          slug: 1,
          colors: 1,
          discount: 1,
          likes: 1,
          priceSale: 1,
          price: 1,
          averageRating: 1,
          vendor: 1,
          shop: 1,
          createdAt: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const createWishlist = async (req, res) => {
  try {
    const user = await getUser(req, res);
    const uid = user._id.toString();
    const wishlist = user.wishlist;
    const { pid } = req.body;
    const isAlready = wishlist.filter((id) => id.toString() === pid);

    if (!Boolean(isAlready.length)) {
      await Users.findByIdAndUpdate(
        uid,
        { $addToSet: { wishlist: pid } }, // Add productId to the wishlist if not already present
        { new: true }
      );

      await Products.findByIdAndUpdate(pid, {
        $inc: { likes: 1 },
      });

      const newWishlist = [...wishlist, pid];

      return res.status(201).json({
        success: true,
        data: newWishlist,
        type: 'pushed',
        message: 'Added To Wishlist',
      });
    }
    await Products.findByIdAndUpdate(pid, {
      $inc: { likes: -1 },
    });

    await Users.findByIdAndUpdate(
      uid,
      { $pull: { wishlist: pid } },
      { new: true }
    );

    const removedWishlist = wishlist.filter((id) => id.toString() !== pid);

    return res.status(200).json({
      success: true,
      type: 'pulled',
      message: 'Removed From Wishlist',
      data: removedWishlist,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
module.exports = {
  getWishlist,
  createWishlist,
};


// const Products = require('../models/Product');
// const Users = require('../models/User');
// const { getUser } = require('../config/getUser');

// // Function to get the wishlist
// const getWishlist = async (req, res) => {
//   try {
//     const user = await getUser(req, res);
//     if (!user) {
//       return res.status(400).json({ success: false, message: 'User not found' });
//     }

//     // Fetch wishlist and related products
//     const wishlist = user.wishlist;
//     const products = await Products.aggregate([
//       {
//         $match: {
//           _id: { $in: wishlist }, // Match products with IDs present in the wishlist
//         },
//       },
//       {
//         $lookup: {
//           from: 'productreviews',
//           localField: 'reviews',
//           foreignField: '_id',
//           as: 'reviews',
//         },
//       },
//       {
//         $addFields: {
//           averageRating: { $avg: '$reviews.rating' },
//           image: { $arrayElemAt: ['$images', 0] },
//         },
//       },
//       {
//         $project: {
//           image: { url: '$image.url', blurDataURL: '$image.blurDataURL' },
//           name: 1,
//           slug: 1,
//           colors: 1,
//           discount: 1,
//           likes: 1,
//           priceSale: 1,
//           price: 1,
//           averageRating: 1,
//           vendor: 1,
//           shop: 1,
//           createdAt: 1,
//         },
//       },
//     ]);

//     return res.status(200).json({
//       success: true,
//       data: products,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ success: false, message: 'Error fetching wishlist: ' + error.message });
//   }
// };

// // Function to create or update the wishlist (add/remove products)
// const createWishlist = async (req, res) => {
//   try {
//     const user = await getUser(req, res);
//     if (!user) {
//       return res.status(400).json({ success: false, message: 'User not found' });
//     }

//     const uid = user._id.toString();
//     const wishlist = user.wishlist;
//     const { pid } = req.body;

//     // Check if the product is already in the wishlist
//     const isAlready = wishlist.some((id) => id.toString() === pid);

//     if (!isAlready) {
//       // Add product to wishlist if not already there
//       await Users.findByIdAndUpdate(uid, { $addToSet: { wishlist: pid } }, { new: true });
//       await Products.findByIdAndUpdate(pid, { $inc: { likes: 1 } });

//       const newWishlist = [...wishlist, pid];

//       return res.status(201).json({
//         success: true,
//         data: newWishlist,
//         type: 'pushed',
//         message: 'Added To Wishlist',
//       });
//     }

//     // Remove product from wishlist if it is already there
//     await Products.findByIdAndUpdate(pid, { $inc: { likes: -1 } });
//     await Users.findByIdAndUpdate(uid, { $pull: { wishlist: pid } }, { new: true });

//     const removedWishlist = wishlist.filter((id) => id.toString() !== pid);

//     return res.status(200).json({
//       success: true,
//       type: 'pulled',
//       message: 'Removed From Wishlist',
//       data: removedWishlist,
//     });

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ success: false, message: 'Error updating wishlist: ' + error.message });
//   }
// };

// module.exports = {
//   getWishlist,
//   createWishlist,
// };
