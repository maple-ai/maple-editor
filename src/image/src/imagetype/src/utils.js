/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module imagetype/utils
 */

/**
 * Returns imagetype options as defined in `config.imagetype.options` but processed to consider
 * the editor localization, i.e. to display {@link module:imagetype/imagetype~ImageTypeOption}
 * in the correct language.
 *
 * Note: The reason behind this method is that there is no way to use {@link module:utils/locale~Locale#t}
 * when the user configuration is defined because the editor does not exist yet.
 *
 * @param {module:core/editor/editor~Editor} editor
 * @returns {Array.<module:imagetype/imagetype~ImageTypeOption>}.
 */
export function getLocalizedOptions( editor ) {
	const t = editor.t;
	const localizedTitles = {
		'Default': t( 'Default' ),
		'Before': t( 'Before' ),
		'After': t( 'After' )
	};

	return editor.config.get( 'imagetype.options' ).map( option => {
		const title = localizedTitles[ option.title ];

		if ( title && title != option.title ) {
			option.title = title;
		}

		return option;
	} );
}
