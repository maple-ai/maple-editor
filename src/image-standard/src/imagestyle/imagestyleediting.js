/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/imagestyle/imagestyleediting
 */

import { Plugin } from 'ckeditor5/src/core';
import ImageStandardStyleCommand from './imagestylecommand';
import ImageStandardUtils from '../imageutils';
import utils from './utils';
import { viewToModelStyleAttribute, modelToViewStyleAttribute } from './converters';

/**
 * The image style engine plugin. It sets the default configuration, creates converters and registers
 * {@link module:image/imagestyle/imagestylecommand~ImageStandardStyleCommand ImageStandardStyleCommand}.
 *
 * @extends module:core/plugin~Plugin
 */
export default class ImageStandardStyleEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'ImageStandardStyleEditing';
	}

	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ ImageStandardUtils ];
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const { normalizeStyles, getDefaultStylesConfiguration } = utils;
		const editor = this.editor;
		const isBlockPluginLoaded = editor.plugins.has( 'ImageStandardBlockEditing' );
		const isInlinePluginLoaded = editor.plugins.has( 'ImageStandardInlineEditing' );

		editor.config.define( 'image.styles', getDefaultStylesConfiguration( isBlockPluginLoaded, isInlinePluginLoaded ) );

		/**
		 * It contains a list of the normalized and validated style options.
		 *
		 * * Each option contains a complete icon markup.
		 * * The style options not supported by any of the loaded image editing plugins (
		 * {@link module:image/image/imageinlineediting~ImageStandardInlineEditing `ImageStandardInlineEditing`} or
		 * {@link module:image/image/imageblockediting~ImageStandardBlockEditing `ImageStandardBlockEditing`}) are filtered out.
		 *
		 * @protected
		 * @readonly
		 * @type {module:image/imagestyle~ImageStandardStyleConfig}
		 */
		this.normalizedStyles = normalizeStyles( {
			conimagedStyles: editor.config.get( 'image.styles' ),
			isBlockPluginLoaded,
			isInlinePluginLoaded,
		} );

		this._setupConversion( isBlockPluginLoaded, isInlinePluginLoaded );
		this._setupPostFixer();

		// Register imageStyle command.
		editor.commands.add( 'imageStyle', new ImageStandardStyleCommand( editor, this.normalizedStyles ) );
	}

	/**
	 * Sets the editor conversion taking the presence of
	 * {@link module:image/image/imageinlineediting~ImageStandardInlineEditing `ImageStandardInlineEditing`}
	 * and {@link module:image/image/imageblockediting~ImageStandardBlockEditing `ImageStandardBlockEditing`} plugins into consideration.
	 *
	 * @private
	 * @param {Boolean} isBlockPluginLoaded
	 * @param {Boolean} isInlinePluginLoaded
	 */
	_setupConversion( isBlockPluginLoaded, isInlinePluginLoaded ) {
		const editor = this.editor;
		const schema = editor.model.schema;

		const modelToViewConverter = modelToViewStyleAttribute( this.normalizedStyles );
		const viewToModelConverter = viewToModelStyleAttribute( this.normalizedStyles );

		editor.editing.downcastDispatcher.on( 'attribute:imageStyle', modelToViewConverter );
		editor.data.downcastDispatcher.on( 'attribute:imageStyle', modelToViewConverter );

		// Allow imageStyle attribute in image and imageStandardInline.
		// We could call it 'style' but https://github.com/ckeditor/ckeditor5-engine/issues/559.
		if ( isBlockPluginLoaded ) {
			schema.extend( 'imageStandardBlock', { allowAttributes: 'imageStyle' } );

			// Converter for image element from view to model.
			editor.data.upcastDispatcher.on( 'element:image', viewToModelConverter, { priority: 'low' } );
		}

		if ( isInlinePluginLoaded ) {
			schema.extend( 'imageStandardInline', { allowAttributes: 'imageStyle' } );

			// Converter for the image element from view to model.
			editor.data.upcastDispatcher.on( 'element:image', viewToModelConverter, { priority: 'low' } );
		}
	}

	/**
	 * Registers a post-fixer that will make sure that the style attribute value is correct for a specific image type (block vs inline).
	 *
	 * @private
	 */
	_setupPostFixer() {
		const editor = this.editor;
		const document = editor.model.document;

		const imageUtils = editor.plugins.get( ImageStandardUtils );
		const stylesMap = new Map( this.normalizedStyles.map( style => [ style.name, style ] ) );

		// Make sure that style attribute is valid for the image type.
		document.registerPostFixer( writer => {
			let changed = false;

			for ( const change of document.differ.getChanges() ) {
				if ( change.type == 'insert' || change.type == 'attribute' && change.attributeKey == 'imageStyle' ) {
					let element = change.type == 'insert' ? change.position.nodeAfter : change.range.start.nodeAfter;

					if ( element && element.is( 'element', 'paragraph' ) && element.childCount > 0 ) {
						element = element.getChild( 0 );
					}

					if ( !imageUtils.isImageStandard( element ) ) {
						continue;
					}

					const imageStyle = element.getAttribute( 'imageStyle' );

					if ( !imageStyle ) {
						continue;
					}

					const imageStyleDefinition = stylesMap.get( imageStyle );

					if ( !imageStyleDefinition || !imageStyleDefinition.modelElements.includes( element.name ) ) {
						writer.removeAttribute( 'imageStyle', element );
						changed = true;
					}
				}
			}

			return changed;
		} );
	}
}
