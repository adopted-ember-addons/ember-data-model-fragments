import {
  macroCondition,
  dependencySatisfies,
  importSync,
} from '@embroider/macros';

/** The built-in transform classes, as registered with the strict resolver. */
interface BuiltinTransforms {
  BooleanTransform: unknown;
  DateTransform: unknown;
  NumberTransform: unknown;
  StringTransform: unknown;
}

// `@warp-drive/ember/install` reads `getOwnConfig().deprecations` from
// `@warp-drive/build-config`, which only ships a macro-resolvable config on
// ember-data >= 4.13. Importing it on 4.12 throws at build time.
export function installWarpDriveEmber() {
  if (macroCondition(dependencySatisfies('ember-data', '>=4.13.0-alpha.0'))) {
    importSync('@warp-drive/ember/install');
  }
}

// ember-data >= 4.13 (v2 addon shape) exposes the built-in transforms as
// named exports from `@ember-data/serializer/transform`. ember-data 4.12 is
// a v1 addon that doesn't ship them at any public ESM path — the addon
// re-exports them from `@ember-data/serializer/-private` via
// `app/transforms/*` files, so we read them from there. Either way the
// strict resolver needs them registered explicitly.
export function getBuiltinTransformModules(): Record<string, unknown> {
  let BooleanTransform, DateTransform, NumberTransform, StringTransform;
  if (macroCondition(dependencySatisfies('ember-data', '>=4.13.0-alpha.0'))) {
    ({ BooleanTransform, DateTransform, NumberTransform, StringTransform } =
      importSync('@ember-data/serializer/transform') as BuiltinTransforms);
  } else {
    ({ BooleanTransform, DateTransform, NumberTransform, StringTransform } =
      importSync('@ember-data/serializer/-private') as BuiltinTransforms);
  }
  return {
    './transforms/boolean': BooleanTransform,
    './transforms/date': DateTransform,
    './transforms/number': NumberTransform,
    './transforms/string': StringTransform,
  };
}
