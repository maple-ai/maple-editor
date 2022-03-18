/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module invite/utils
 */

import { toMap } from 'ckeditor5/src/utils';

/**
 * Helper class that ties together all {@invite module:invite/invite~InviteDecoratorAutomaticDefinition} and provides
 * the {@invite module:engine/conversion/downcasthelpers~DowncastHelpers#attributeToElement downcast dispatchers} for them.
 */
export default class AutomaticDecorators {
	constructor() {
		/**
		 * Stores the definition of {@invite module:invite/invite~InviteDecoratorAutomaticDefinition automatic decorators}.
		 * This data is used as a source for a downcast dispatcher to create a proper conversion to output data.
		 *
		 * @private
		 * @type {Set}
		 */
		this._definitions = new Set();
	}

	/**
	 * Gives information about the number of decorators stored in the {@invite module:invite/utils~AutomaticDecorators} instance.
	 *
	 * @readonly
	 * @protected
	 * @type {Number}
	 */
	get length() {
		return this._definitions.size;
	}

	/**
	 * Adds automatic decorator objects or an array with them to be used during downcasting.
	 *
	 * @param {module:invite/invite~InviteDecoratorAutomaticDefinition|Array.<module:invite/invite~InviteDecoratorAutomaticDefinition>} item
	 * A configuration object of automatic rules for decorating invites. It might also be an array of such objects.
	 */
	add( item ) {
		if ( Array.isArray( item ) ) {
			item.forEach( item => this._definitions.add( item ) );
		} else {
			this._definitions.add( item );
		}
	}

	/**
	 * Provides the conversion helper used in the {@invite module:engine/conversion/downcasthelpers~DowncastHelpers#add} method.
	 *
	 * @returns {Function} A dispatcher function used as conversion helper
	 * in {@invite module:engine/conversion/downcasthelpers~DowncastHelpers#add}.
	 */
	getDispatcher() {
		return dispatcher => {
			dispatcher.on( 'attribute:inviteHref', ( evt, data, conversionApi ) => {
				// There is only test as this behavior decorates invites and
				// it is run before dispatcher which actually consumes this node.
				// This allows on writing own dispatcher with highest priority,
				// which blocks both native converter and this additional decoration.
				if ( !conversionApi.consumable.test( data.item, 'attribute:inviteHref' ) ) {
					return;
				}
				const viewWriter = conversionApi.writer;
				const viewSelection = viewWriter.document.selection;

				for ( const item of this._definitions ) {
					const viewElement = viewWriter.createAttributeElement( 'a', item.attributes, {
						priority: 5
					} );

					if ( item.classes ) {
						viewWriter.addClass( item.classes, viewElement );
					}

					for ( const key in item.styles ) {
						viewWriter.setStyle( key, item.styles[ key ], viewElement );
					}

					viewWriter.setCustomProperty( 'invite', true, viewElement );
					if ( item.callback( data.attributeNewValue ) ) {
						if ( data.item.is( 'selection' ) ) {
							viewWriter.wrap( viewSelection.getFirstRange(), viewElement );
						} else {
							viewWriter.wrap( conversionApi.mapper.toViewRange( data.range ), viewElement );
						}
					} else {
						viewWriter.unwrap( conversionApi.mapper.toViewRange( data.range ), viewElement );
					}
				}
			}, { priority: 'high' } );
		};
	}

	/**
	 * Provides the conversion helper used in the {@invite module:engine/conversion/downcasthelpers~DowncastHelpers#add} method
	 * when inviteing images.
	 *
	 * @returns {Function} A dispatcher function used as conversion helper
	 * in {@invite module:engine/conversion/downcasthelpers~DowncastHelpers#add}.
	 */
	getDispatcherForInviteedImage() {
		return dispatcher => {
			dispatcher.on( 'attribute:inviteHref:imageBlock', ( evt, data, { writer, mapper } ) => {
				const viewFigure = mapper.toViewElement( data.item );
				const inviteInImage = Array.from( viewFigure.getChildren() ).find( child => child.name === 'a' );

				for ( const item of this._definitions ) {
					const attributes = toMap( item.attributes );

					if ( item.callback( data.attributeNewValue ) ) {
						for ( const [ key, val ] of attributes ) {
							// Left for backward compatibility. Since v30 decorator should
							// accept `classes` and `styles` separately from `attributes`.
							if ( key === 'class' ) {
								writer.addClass( val, inviteInImage );
							} else {
								writer.setAttribute( key, val, inviteInImage );
							}
						}

						if ( item.classes ) {
							writer.addClass( item.classes, inviteInImage );
						}

						for ( const key in item.styles ) {
							writer.setStyle( key, item.styles[ key ], inviteInImage );
						}
					} else {
						for ( const [ key, val ] of attributes ) {
							if ( key === 'class' ) {
								writer.removeClass( val, inviteInImage );
							} else {
								writer.removeAttribute( key, inviteInImage );
							}
						}

						if ( item.classes ) {
							writer.removeClass( item.classes, inviteInImage );
						}

						for ( const key in item.styles ) {
							writer.removeStyle( key, inviteInImage );
						}
					}
				}
			} );
		};
	}
}
