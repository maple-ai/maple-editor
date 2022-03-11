/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module imagetype/imagetype
 */

import { Plugin } from 'ckeditor5/src/core';

import ImageTypeEditing from './imagetypeediting';
import ImageTypeUI from './imagetypeui';

import '../theme/imagetype.css';

/**
 * The imagetypes feature.
 *
 * For a detailed overview, check the {@glink features/imagetypes ImageTypes feature documentation}
 * and the {@glink api/imagetype package page}.
 *
 * This is a "glue" plugin which loads the {@link module:imagetype/imagetypeediting~ImageTypeEditing imagetype editing feature}
 * and {@link module:imagetype/imagetypeui~ImageTypeUI imagetype UI feature}.
 *
 * @extends module:core/plugin~Plugin
 */
export default class ImageType extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ ImageTypeEditing, ImageTypeUI ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'ImageType';
	}
}

/**
 * The configuration of the imagetype feature. Introduced by the {@link module:imagetype/imagetypeediting~ImageTypeEditing} feature.
 *
 * Read more in {@link module:imagetype/imagetype~ImageTypeConfig}.
 *
 * @member {module:imagetype/imagetype~ImageTypeConfig} module:core/editor/editorconfig~EditorConfig#imagetype
 */

/**
 * The configuration of the imagetype feature.
 * The option is used by the {@link module:imagetype/imagetypeediting~ImageTypeEditing} feature.
 *
 *		ClassicEditor
 *			.create( {
 * 				imagetype: ... // ImageType feature config.
 *			} )
 *			.then( ... )
 *			.catch( ... );
 *
 * See {@link module:core/editor/editorconfig~EditorConfig all editor options}.
 *
 * @interface ImageTypeConfig
 */

/**
 * The available imagetype options.
 *
 * The default value is:
 *
 *		const imagetypeConfig = {
 *			options: [
 *				{ model: 'paragraph', title: 'Paragraph', class: 'ck-imagetype_paragraph' },
 *				{ model: 'default', view: 'h2', title: 'Default', class: 'ck-imagetype_default' },
 *				{ model: 'before', view: 'h3', title: 'Before', class: 'ck-imagetype_before' },
 *				{ model: 'after', view: 'h4', title: 'ImageType 3', class: 'ck-imagetype_after' }
 *			]
 *		};
 *
 * It defines 3 levels of imagetypes. In the editor model they will use `default`, `before`, and `after` elements.
 * Their respective view elements (so the elements output by the editor) will be: `h2`, `h3`, and `h4`. This means that
 * if you choose "Default" in the imagetypes dropdown the editor will turn the current block to `<default>` in the model
 * which will result in rendering (and outputting to data) the `<h2>` element.
 *
 * The `title` and `class` properties will be used by the `imagetypes` dropdown to render available options.
 * Usually, the first option in the imagetypes dropdown is the "Paragraph" option, hence it's also defined on the list.
 * However, you don't need to define its view representation because it's handled by
 * the {@link module:paragraph/paragraph~Paragraph} feature (which is required by
 * the {@link module:imagetype/imagetypeediting~ImageTypeEditing} feature).
 *
 * You can **read more** about configuring imagetype levels and **see more examples** in
 * the {@glink features/imagetypes ImageTypes} guide.
 *
 * Note: In the model you should always start from `default`, regardless of how the imagetypes are represented in the view.
 * That's assumption is used by features like {@link module:autoformat/autoformat~Autoformat} to know which element
 * they should use when applying the first level imagetype.
 *
 * The defined imagetypes are also available as values passed to the `'imagetype'` command under their model names.
 * For example, the below code will apply `<default>` to the current selection:
 *
 *		editor.execute( 'imagetype', { value: 'default' } );
 *
 * @member {Array.<module:imagetype/imagetype~ImageTypeOption>} module:imagetype/imagetype~ImageTypeConfig#options
 */

/**
 * ImageType option descriptor.
 *
 * @typedef {Object} module:imagetype/imagetype~ImageTypeOption
 * @property {String} model Name of the model element to convert.
 * @property {module:engine/view/elementdefinition~ElementDefinition} view Definition of a view element to convert from/to.
 * @property {String} title The user-readable title of the option.
 * @property {String} class The class which will be added to the dropdown item representing this option.
 * @property {String} [icon] Icon used by {@link module:imagetype/imagetypebuttonsui~ImageTypeButtonsUI}. It can be omitted when using
 * the default configuration.
 * @extends module:engine/conversion/conversion~ConverterDefinition
 */
