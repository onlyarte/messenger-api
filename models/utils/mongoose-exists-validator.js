const mongoose = require('mongoose');

const plugin = (schema, options) => {
  schema.eachPath((pathname, schematype) => {
    if (schematype.options.ref && schematype.options.exists) {
      schematype.validate({
        validator: function(value) {
          return mongoose.model(schematype.options.ref).exists({ _id: value });
        },
        message: props =>
          `${schematype.options.ref} \`${props.value}\` does not exist.`,
      });
    } else if (
      schematype.options.type instanceof Array &&
      schematype.options.type[0] &&
      schematype.options.type[0].ref &&
      schematype.options.type[0].exists
    ) {
      schematype.validate({
        validator: async function(value) {
          const predicates = await Promise.all(
            value.map(single =>
              mongoose.model(schematype.options.type[0].ref).exists({ _id: single })
            )
          );
          return predicates.every(p => p === true);
        },
        message: `${schematype.options.type[0].ref} does not exist.`,
      });
    }
  });
};

module.exports = plugin;
