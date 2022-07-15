/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module horizontal-line/horizontallineediting
 */

import { Plugin } from 'ckeditor5/src/core';
import { toWidget } from 'ckeditor5/src/widget';

import TaggingCommand from './horizontallinecommand';

import '../theme/horizontalline.css';

/**
 * The horizontal line editing feature.
 *
 * @extends module:core/plugin~Plugin
 */
export default class TaggingEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'TaggingEditing';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const schema = editor.model.schema;
		const t = editor.t;
		const conversion = editor.conversion;

		schema.register( 'tagging', {
			inheritAllFrom: '$blockObject'
		} );

		conversion.for( 'dataDowncast' ).elementToElement( {
			model: 'tagging',
			view: ( modelElement, { writer } ) => {
				return writer.createEmptyElement( 'hr' );
			}
		} );

		conversion.for( 'editingDowncast' ).elementToElement( {
			model: 'tagging',
			view: ( modelElement, { writer } ) => {

				
				const label = t( 'Tag' );

				const viewWrapper = writer.createContainerElement( 'div', null,
					writer.createEmptyElement( 'hr' )
				);

				writer.addClass( 'ck-horizontal-line', viewWrapper );
				writer.setCustomProperty( 'hr', true, viewWrapper );

				return toTaggingWidget( viewWrapper, writer, label );
			}
		} );

		conversion.for( 'upcast' ).elementToElement( { view: 'hr', model: 'tagging' } );

		editor.commands.add( 'tagging', new TaggingCommand( editor ) );
	}
}

// Converts a given {@link module:engine/view/element~Element} to a horizontal line widget:
// * Adds a {@link module:engine/view/element~Element#_setCustomProperty custom property} allowing to
//   recognize the horizontal line widget element.
// * Calls the {@link module:widget/utils~toWidget} function with the proper element's label creator.
//
//  @param {module:engine/view/element~Element} viewElement
//  @param {module:engine/view/downcastwriter~DowncastWriter} writer An instance of the view writer.
//  @param {String} label The element's label.
//  @returns {module:engine/view/element~Element}
function toTaggingWidget( viewElement, writer, label ) {
	writer.setCustomProperty( 'tagging', true, viewElement );

	return toWidget( viewElement, writer, { label } );
}
