/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module imagetype/imagetypecommand
 */

import { Command } from 'ckeditor5/src/core';
import { first } from 'ckeditor5/src/utils';

/**
 * The imagetype command. It is used by the {@link module:imagetype/imagetype~ImageType imagetype feature} to apply imagetypes.
 *
 * @extends module:core/command~Command
 */
export default class ImageTypeCommand extends Command {
	/**
	 * Creates an instance of the command.
	 *
	 * @param {module:core/editor/editor~Editor} editor Editor instance.
	 * @param {Array.<String>} modelElements Names of the element which this command can apply in the model.
	 */
	constructor( editor, modelElements ) {
		super( editor );

		/**
		 * If the selection starts in a imagetype (which {@link #modelElements is supported by this command})
		 * the value is set to the name of that imagetype model element.
		 * It is  set to `false` otherwise.
		 *
		 * @observable
		 * @readonly
		 * @member {Boolean|String} #value
		 */

		/**
		 * Set of defined model's elements names that this command support.
		 * See {@link module:imagetype/imagetype~ImageTypeOption}.
		 *
		 * @readonly
		 * @member {Array.<String>}
		 */
		this.modelElements = modelElements;
	}

	/**
	 * @inheritDoc
	 */
	refresh() {
		const block = first( this.editor.model.document.selection.getSelectedBlocks() );

		this.value = block.name;
		this.isEnabled = true;
	}

	/**
	 * Executes the command. Applies the imagetype to the selected blocks or, if the first selected
	 * block is a imagetype already, turns selected imagetypes (of this level only) to paragraphs.
	 *
	 * @param {Object} options
	 * @param {String} options.value Name of the element which this command will apply in the model.
	 * @fires execute
	 */
	execute( options ) {
		const editor = this.editor;
		const model = this.editor.model;
		const document = model.document;

		const modelElement = options.value;
		console.log("modelElement", modelElement);

		model.change( writer => {
			const imageUtils = editor.plugins.get( 'ImageUtils' );
			console.log("options.valu", options.value);
			const imageElement = imageUtils.getClosestSelectedImageElement( model.document.selection );
			writer.setAttribute( 'data-type', options.value, imageElement );

			const blocks = Array.from( document.selection.getSelectedBlocks() )
				.filter( block => {
					return checkCanBecomeImageType( block, modelElement, model.schema );
				} );
				console.log("blocks", blocks);

			for ( const block of blocks ) {
				if ( !block.is( 'element', modelElement ) ) {
					writer.rename( block, modelElement );
				}
			}
		} );
	}
}

// Checks whether the given block can be replaced by a specific imagetype.
//
// @private
// @param {module:engine/model/element~Element} block A block to be tested.
// @param {module:imagetype/imagetypecommand~ImageTypeCommand#modelElement} imagetype Command element name in the model.
// @param {module:engine/model/schema~Schema} schema The schema of the document.
// @returns {Boolean}
function checkCanBecomeImageType( block, imagetype, schema ) {
	return schema.checkChild( block.parent, imagetype ) && !schema.isObject( block );
}
