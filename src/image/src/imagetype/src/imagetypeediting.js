/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module imagetype/imagetypeediting
 */

import { Plugin } from 'ckeditor5/src/core';
import { Paragraph } from 'ckeditor5/src/paragraph';
import { priorities } from 'ckeditor5/src/utils';

import ImageTypeCommand from './imagetypecommand';

const defaultModelElement = 'paragraph';

/**
 * The imagetypes engine feature. It handles switching between block formats &ndash; imagetypes and paragraph.
 * This class represents the engine part of the imagetype feature. See also {@link module:imagetype/imagetype~ImageType}.
 * It introduces `default`-`imagetypeN` commands which allow to convert paragraphs into imagetypes.
 *
 * @extends module:core/plugin~Plugin
 */
export default class ImageTypeEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'ImageTypeEditing';
	}

	/**
	 * @inheritDoc
	 */
	constructor( editor ) {
		super( editor );

		editor.config.define( 'imagetype', {
			options: [
				{ model: 'default', view: 'h2', title: 'Default', class: 'ck-imagetype_default' },
				{ model: 'before', view: 'h3', title: 'Before', class: 'ck-imagetype_before' },
				{ model: 'after', view: 'h4', title: 'After', class: 'ck-imagetype_after' }
			]
		} );
	}

	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ Paragraph ];
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const options = editor.config.get( 'imagetype.options' );

		const modelElements = [];

		for ( const option of options ) {
			// Skip paragraph - it is defined in required Paragraph feature.
			if ( option.model !== defaultModelElement ) {
				// Schema.
				editor.model.schema.register( option.model, {
					inheritAllFrom: '$block'
				} );

				editor.conversion.elementToElement( option );

				modelElements.push( option.model );
			}
		}

		this._addDefaultH1Conversion( editor );

		// Register the imagetype command for this option.
		editor.commands.add( 'imagetype', new ImageTypeCommand( editor, modelElements ) );
	}

	/**
	 * @inheritDoc
	 */
	afterInit() {
		// If the enter command is added to the editor, alter its behavior.
		// Enter at the end of a imagetype element should create a paragraph.
		const editor = this.editor;
		const enterCommand = editor.commands.get( 'enter' );
		const options = editor.config.get( 'imagetype.options' );

		if ( enterCommand ) {
			this.listenTo( enterCommand, 'afterExecute', ( evt, data ) => {
				const positionParent = editor.model.document.selection.getFirstPosition().parent;
				const isImageType = options.some( option => positionParent.is( 'element', option.model ) );

				if ( isImageType && !positionParent.is( 'element', defaultModelElement ) && positionParent.childCount === 0 ) {
					data.writer.rename( positionParent, defaultModelElement );
				}
			} );
		}
	}

	/**
	 * Adds default conversion for `h1` -> `default` with a low priority.
	 *
	 * @private
	 * @param {module:core/editor/editor~Editor} editor Editor instance on which to add the `h1` conversion.
	 */
	_addDefaultH1Conversion( editor ) {
		editor.conversion.for( 'upcast' ).elementToElement( {
			model: 'default',
			view: 'h1',
			// With a `low` priority, `paragraph` plugin autoparagraphing mechanism is executed. Make sure
			// this listener is called before it. If not, `h1` will be transformed into a paragraph.
			converterPriority: priorities.get( 'low' ) + 1
		} );
	}
}
