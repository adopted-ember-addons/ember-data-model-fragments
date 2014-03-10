import FragmentTransform from './fragments/transform';

var initializers = [
  {
    name: "fragmentTransform",
    before: "store",

    initialize: function(container, application) {
      application.register('transform:fragment', FragmentTransform);
    }
  }
];

export default initializers;
