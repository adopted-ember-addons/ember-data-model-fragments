import Model, { attr } from '@ember-data/model';
import { module, test } from 'qunit';
import Fragment from '#src/fragment.ts';
import { fragment, fragmentArray } from '#src/attributes/index.ts';
import FragmentSerializer from '#src/serializer.ts';
import { setupApplicationTest } from '../helpers/index.ts';
import type { TestContext, TestStore } from '../helpers/index.ts';
import Animal from '../../demo-app/models/animal.ts';
import Lion from '../../demo-app/models/lion.ts';
import Elephant from '../../demo-app/models/elephant.ts';
import ComponentOptions from '../../demo-app/models/component-options.ts';
import ComponentOptionsText from '../../demo-app/models/component-options-text.ts';
let store: TestStore;
let zoo: any;

module('unit - Polymorphism', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function (this: TestContext) {
    store = this.owner.lookup('service:store');

    zoo = {
      name: 'Chilly Zoo',
      city: 'Winterfell',
      star: {
        $type: 'lion',
        name: 'Mittens',
        hasManes: 'true',
      },
      animals: [
        {
          $type: 'lion',
          name: 'Mittens',
          hasManes: 'true',
        },
        {
          $type: 'elephant',
          name: 'Snuitje',
          trunkLength: 4,
        },
      ],
    };
  });

  hooks.afterEach(function (this: TestContext) {});

  test('fragment properties support polymorphism', async function (this: TestContext, assert: Assert) {
    store.push({
      data: {
        type: 'zoo',
        id: 1,
        attributes: zoo,
      },
    });

    const zoo2 = await store.findRecord('zoo', 1);
    assert.equal(zoo2.name, 'Chilly Zoo', 'zoo name is correct');
    assert.equal(zoo2.city, 'Winterfell', 'zoo city is correct');

    const star = zoo2.star;
    assert.ok(star instanceof Animal, "zoo's star is an animal");
    assert.equal(star.name, 'Mittens', 'animal name is correct');
    assert.ok(star instanceof Lion, "zoo's star is a lion");
    assert.ok(star.hasManes, 'lion has manes');
  });

  test('fragment array properties support polymorphism', async function (this: TestContext, assert: Assert) {
    store.push({
      data: {
        type: 'zoo',
        id: 1,
        attributes: zoo,
      },
    });

    const zoo2 = await store.findRecord('zoo', 1);
    const animals = zoo2.animals;
    assert.equal(animals.length, 2);

    const first = animals.objectAt(0);
    assert.ok(first instanceof Animal);
    assert.equal(first.name, 'Mittens', "first animal's name is correct");
    assert.ok(first instanceof Lion);
    assert.ok(first.hasManes, 'lion has manes');

    const second = animals.objectAt(1);
    assert.ok(second instanceof Animal);
    assert.equal(second.name, 'Snuitje', "second animal's name is correct");
    assert.ok(second instanceof Elephant);
    assert.equal(second.trunkLength, 4, "elephant's trunk length is correct");
  });

  test('copying a fragment keeps the types of its polymorphic fragments', function (this: TestContext, assert: Assert) {
    // Like the demo `Animal`, these classes don't declare the `$type` attribute
    class Exhibit extends Fragment {
      @fragment('animal', { polymorphic: true, typeKey: '$type' })
      declare star: any;
      @fragmentArray('animal', { polymorphic: true, typeKey: '$type' })
      declare animals: any;
    }

    this.owner.register('model:exhibit', Exhibit);

    const exhibit = store.createFragment('exhibit', {
      star: { $type: 'lion', name: 'Mittens', hasManes: true },
      animals: [{ $type: 'elephant', name: 'Snuitje', trunkLength: 4 }],
    });
    const copy: any = exhibit.copy();
    const elephant = copy.animals.objectAt(0);

    assert.ok(copy.star instanceof Lion, 'the star is a lion');
    assert.true(copy.star.hasManes, 'with a mane');
    assert.ok(elephant instanceof Elephant, 'the animal is an elephant');
    assert.strictEqual(elephant.trunkLength, 4, 'with a trunk');
  });

  test('copying a fragment keeps the types of its polymorphic fragments with a function typeKey', function (this: TestContext, assert: Assert) {
    class Panel extends Fragment {
      @fragment('component-options', {
        polymorphic: true,
        typeKey: (data: any) =>
          // eslint-disable-next-line no-prototype-builtins -- typeKey functions can expect a plain object
          data.hasOwnProperty('fontSize')
            ? 'component-options-text'
            : 'component-options',
      })
      declare options: any;
    }

    this.owner.register('model:panel', Panel);

    const panel = store.createFragment('panel', {
      options: { fontFamily: 'Verdana', fontSize: 12 },
    });
    const copy: any = panel.copy();

    assert.ok(
      copy.options instanceof ComponentOptionsText,
      'the options are text options',
    );
    assert.strictEqual(copy.options.fontSize, 12, 'with a font size');
  });

  test("copying a fragment doesn't set the typeKey of its base-type fragments", function (this: TestContext, assert: Assert) {
    class Beast extends Fragment {
      @attr('string') declare $type: string;
      @attr('string') declare name: string;
    }

    class Exhibit extends Fragment {
      @fragment('beast', { polymorphic: true, typeKey: '$type' })
      declare beast: any;
    }

    this.owner.register('model:beast', Beast);
    this.owner.register('model:exhibit', Exhibit);

    const exhibit: any = store.createFragment('exhibit', {
      beast: { name: 'Nameless' },
    });
    const copy: any = exhibit.copy();

    assert.ok(copy.beast instanceof Beast, 'the copy is a beast');
    assert.strictEqual(copy.beast.$type, exhibit.beast.$type, 'with no type');
  });

  test('fragments loaded through a serializer keep their polymorphic types', function (this: TestContext, assert: Assert) {
    // The demo `Animal` doesn't declare the `$type` attribute
    store.pushPayload('zoo', { zoo: { id: 1, ...zoo } });

    const record = store.peekRecord('zoo', 1);

    assert.ok(record.star instanceof Lion, 'the star is a lion');
    assert.true(record.star.hasManes, 'with a mane');
    assert.ok(
      record.animals.objectAt(0) instanceof Lion,
      'the first animal is a lion',
    );
    assert.ok(
      record.animals.objectAt(1) instanceof Elephant,
      'the second animal is an elephant',
    );
  });

  module('with a function typeKey', function (hooks) {
    let owners: unknown[];

    const typeKey = (data: unknown, owner: unknown) => {
      owners.push(owner);
      return `component-options-${(owner as Panel).kind}`;
    };

    class Panel extends Model {
      @attr('string') declare kind: string;
      @fragment('component-options', { polymorphic: true, typeKey })
      declare options: any;
      @fragmentArray('component-options', { polymorphic: true, typeKey })
      declare history: any;
    }

    class Dimensions extends Fragment {
      @attr('number') declare widthInCm: number;
    }

    class ComponentOptionsRich extends ComponentOptions {
      @fragment('dimensions') declare size: any;
    }

    class UnderscoredSerializer extends FragmentSerializer {
      keyForAttribute(key: string) {
        return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      }
    }

    hooks.beforeEach(function (this: TestContext) {
      owners = [];
      this.owner.register('model:panel', Panel);
      this.owner.register('model:dimensions', Dimensions);
      this.owner.register('model:component-options-rich', ComponentOptionsRich);
      this.owner.register('serializer:-fragment', UnderscoredSerializer);
    });

    test('loading a payload calls it with the owner record', function (this: TestContext, assert: Assert) {
      store.pushPayload('panel', {
        panel: {
          id: 1,
          kind: 'text',
          options: { font_family: 'Verdana', font_size: 12 },
          history: [{ font_family: 'Arial', font_size: 10 }],
        },
      });

      const panel = store.peekRecord('panel', 1);
      const previous = panel.history.objectAt(0);

      assert.ok(
        panel.options instanceof ComponentOptionsText,
        'the options are text options',
      );
      assert.strictEqual(
        panel.options.fontSize,
        12,
        'normalized by their own serializer',
      );
      assert.ok(
        previous instanceof ComponentOptionsText,
        'so are the ones in the fragment array',
      );
      assert.strictEqual(previous.fontSize, 10, 'normalized the same way');
      assert.strictEqual(owners.length, 2, 'typeKey was called for each');
      assert.true(
        owners.every((owner) => owner === panel),
        'with the owner record',
      );
    });

    test('loading a payload normalizes the fragments nested in its fragments', function (this: TestContext, assert: Assert) {
      store.pushPayload('panel', {
        panel: {
          id: 1,
          kind: 'rich',
          options: { size: { width_in_cm: 10 } },
        },
      });

      const panel = store.peekRecord('panel', 1);

      assert.ok(
        panel.options instanceof ComponentOptionsRich,
        'the options are rich options',
      );
      assert.strictEqual(panel.options.size.widthInCm, 10);
    });
  });

  test("fragment array's createFragment supports polymorphism with string typeKey", async function (this: TestContext, assert: Assert) {
    store.push({
      data: {
        type: 'zoo',
        id: 1,
        attributes: zoo,
      },
    });

    const record = await store.findRecord('zoo', 1);
    const animals = record.animals;

    const newLion = animals.createFragment({
      $type: 'lion',
      name: 'Alex',
      hasManes: 'true',
    });

    assert.ok(newLion instanceof Animal, 'new lion is an animal');
    assert.equal(newLion.name, 'Alex', "new animal's name is correct");
    assert.ok(newLion instanceof Lion, 'new lion is a lion');
    assert.ok(newLion.hasManes, 'lion has manes');
    assert.strictEqual(newLion.zoo, record, 'set the fragment owner');

    const newElephant = animals.createFragment({
      $type: 'elephant',
      name: 'Heffalump',
      trunkLength: 7,
    });

    assert.ok(newElephant instanceof Animal, 'new elephant is an animal');
    assert.equal(newElephant.name, 'Heffalump', "new animal's name is correct");
    assert.ok(newElephant instanceof Elephant, 'new elephant is an elephant');
    assert.equal(
      newElephant.trunkLength,
      7,
      "elephant's trunk length is correct",
    );
    assert.strictEqual(newElephant.zoo, record, 'set the fragment owner');
  });

  test("fragment array's createFragment supports polymorphism with function typeKey", async function (this: TestContext, assert: Assert) {
    store.push({
      data: {
        type: 'component',
        id: 1,
        attributes: {
          type: 'text',
          optionsHistory: [],
        },
      },
    });

    const component = await store.findRecord('component', 1);
    const textOptions = component.optionsHistory.createFragment({
      fontFamily: 'Verdana',
      fontSize: 12,
    });

    assert.ok(
      textOptions instanceof ComponentOptionsText,
      'options is ComponentOptionsText',
    );
    assert.equal(
      textOptions.fontFamily,
      'Verdana',
      'options has correct fontFamily attribute',
    );
    assert.equal(
      textOptions.fontSize,
      12,
      'options has correct fontSize attribute',
    );
    assert.equal(
      component.optionsHistory.length,
      1,
      'fragment object was added to fragment array',
    );
  });

  test('createRecord supports polymorphic typeKey for fragment and fragment arrays', function (this: TestContext, assert: Assert) {
    const zoo = store.createRecord('zoo', {
      star: {
        $type: 'lion',
        name: 'Mittens',
        hasManes: true,
      },
      animals: [
        {
          $type: 'lion',
          name: 'Alex',
          hasManes: false,
        },
        {
          $type: 'elephant',
          name: 'Heffalump',
          trunkLength: 7,
        },
      ],
    });

    const star = zoo.star;
    assert.ok(star instanceof Lion, 'star is a lion');
    assert.strictEqual(star.name, 'Mittens', 'star name is correct');
    assert.strictEqual(star.hasManes, true, 'star has manes');
    assert.strictEqual(star.zoo, zoo, 'star fragment owner is correct');

    const animals = zoo.animals;
    assert.strictEqual(animals.length, 2);

    const lion = animals.firstObject;
    assert.ok(lion instanceof Lion, 'first animal is a lion');
    assert.strictEqual(lion.name, 'Alex', 'lion name is correct');
    assert.false(lion.hasManes, 'lion does not have manes');
    assert.strictEqual(lion.zoo, zoo, 'lion fragment owner is correct');

    const elephant = animals.lastObject;
    assert.ok(elephant instanceof Elephant, 'second animal is an elephant');
    assert.strictEqual(elephant.name, 'Heffalump', 'elephant name is correct');
    assert.strictEqual(elephant.trunkLength, 7, 'trunk length is correct');
    assert.strictEqual(elephant.zoo, zoo, 'elephant fragment owner is correct');
  });
});
