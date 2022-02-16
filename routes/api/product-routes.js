const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// get all products
router.get('/', (req, res) => {
  // find all products
  // be sure to include its associated Category and Tag data
  Product.findAll({
    include:[
      Category,{
        model: Tag,
        through: ProductTag,
      }
    ]
  })
  .then((products)=>res.json(products))
  .catch((err)=>{
    console.log(err)
    res.status(500).json(err)
  })
});

// get one product
router.get('/:id', (req, res) => {
  // find a single product by its `id`
  // be sure to include its associated Category and Tag data
  Product.findOne({
    where: {
      id: req.params.id,
    },
    include:[
      Category,
      { model:Tag,
        through:ProductTag,
      },
    ]
  })
    .then((products)=> res.json(products))
    .catch((err)=>{
      console.log(err)
      res.status(400).json(err)
    })
});

// create new product
router.post('/', (req, res) => {
  /* req.body should look like this...
    {
      product_name: "Basketball",
      price: 200.00,
      stock: 3,
      tagIds: [1, 2, 3, 4]
    }
  */
  Product.create(req.body)
    .then((product) => {
      // if there's product tags, we need to create pairings to bulk create in the ProductTag model
      if (req.body.tagIds.length && req.body.tagIds.length) {
        const productIdArray = req.body.tagIds.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          };
        });
        return ProductTag.bulkCreate(productIdArray);
      }
      // if no product tags, just respond
      res.status(200).json(product);
    })
    .then((productId) => res.status(200).json(productId))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

// update product
router.put('/:id', (req, res) => {
  // update product data
  Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((product) => {
      if (req.body.tagIds && req.body.tagIds.length){
        const productItems= ProductTag.findAll({ where: { product_id: req.params.id }
        })

      const productId = productItems.map(({ tag_id }) => tag_id);
      // create filtered list of new tag_ids
      const newProductItems = req.body.tagIds
        .filter((tag_id) => !productId.includes(tag_id))
        .map((tag_id) => {
          return {
            product_id: req.params.id,
            tag_id,
          };
        });
      // figure out which ones to remove
      const productRemove = productItems
        .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
        .map(({ id }) => id);

      // run both actions
      return Promise.all([
        ProductTag.destroy({ where: { id: productRemove } }),
        ProductTag.bulkCreate(newProductItems),
      ]);
      }
      return res.json(product)
    })
    .catch((err) => {
      // console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/:id', (req, res) => {
  // delete one product by its `id` value
  Product.destroy({
    where:{
      id: req.params.id,
    }
  })
  .then((products)=>{
    console.log(products)
    res.json(products)
  })
  .catch((err)=>{
    console.log(err)
    res.status(400).json(err)
  })
});

module.exports = router;
