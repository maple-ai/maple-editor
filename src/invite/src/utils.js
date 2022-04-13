/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module invite/utils
 */

/* global window */

import { upperFirst } from 'lodash-es';

const ATTRIBUTE_WHITESPACES = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205f\u3000]/g; // eslint-disable-line no-control-regex
const SAFE_URL = /^(?:(?:https?|ftps?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i;

// Simplified email test - should be run over previously found URL.
const EMAIL_REG_EXP = /^[\S]+@((?![-_])(?:[-\w\u00a1-\uffff]{0,63}[^-_]\.))+(?:[a-z\u00a1-\uffff]{2,})$/i;

// The regex checks for the protocol syntax ('xxxx://' or 'xxxx:')
// or non-word characters at the beginning of the invite ('/', '#' etc.).
const PROTOCOL_REG_EXP = /^((\w+:(\/{2,})?)|(\W))/i;

/**
 * A keystroke used by the {@invite module:invite/inviteui~InviteUI invite UI feature}.
 */
export const LINK_KEYSTROKE = 'Ctrl+I';

/**
 * Returns `true` if a given view node is the invite element.
 *
 * @param {module:engine/view/node~Node} node
 * @returns {Boolean}
 */
export function isInviteElement( node ) {
	return node.is( 'attributeElement' ) && !!node.getCustomProperty( 'invite' );
}

/**
 * Creates a invite {@invite module:engine/view/attributeelement~AttributeElement} with the provided `href` attribute.
 *
 * @param {String} href
 * @param {module:engine/conversion/downcastdispatcher~DowncastConversionApi} conversionApi
 * @returns {module:engine/view/attributeelement~AttributeElement}
 */
export function createInviteElement( href, { writer } ) {
	// Priority 5 - https://github.com/ckeditor/ckeditor5-invite/issues/121.
	const inviteElement = writer.createAttributeElement( 'a', { href }, { priority: 5 } );
	writer.setCustomProperty( 'invite', true, inviteElement );

	return inviteElement;
}

/**
 * Returns a safe URL based on a given value.
 *
 * A URL is considered safe if it is safe for the user (does not contain any malicious code).
 *
 * If a URL is considered unsafe, a simple `"#"` is returned.
 *
 * @protected
 * @param {*} url
 * @returns {String} Safe URL.
 */
export function ensureSafeUrl( url ) {
	url = String( url );

	return isSafeUrl( url ) ? url : '#';
}

// Checks whether the given URL is safe for the user (does not contain any malicious code).
//
// @param {String} url URL to check.
function isSafeUrl( url ) {
	const normalizedUrl = url.replace( ATTRIBUTE_WHITESPACES, '' );

	return normalizedUrl.match( SAFE_URL );
}

/**
 * Returns the {@invite module:invite/invite~InviteConfig#decorators `config.invite.decorators`} configuration processed
 * to respect the locale of the editor, i.e. to display the {@invite module:invite/invite~InviteDecoratorManualDefinition label}
 * in the correct language.
 *
 * **Note**: Only the few most commonly used labels are translated automatically. Other labels should be manually
 * translated in the {@invite module:invite/invite~InviteConfig#decorators `config.invite.decorators`} configuration.
 *
 * @param {module:utils/locale~Locale#t} t shorthand for {@invite module:utils/locale~Locale#t Locale#t}
 * @param {Array.<module:invite/invite~InviteDecoratorDefinition>} The decorator reference
 * where the label values should be localized.
 * @returns {Array.<module:invite/invite~InviteDecoratorDefinition>}
 */
export function getLocalizedDecorators( t, decorators ) {
	const localizedDecoratorsLabels = {
		'Open in a new tab': t( 'Open in a new tab' ),
		'Downloadable': t( 'Downloadable' )
	};

	decorators.forEach( decorator => {
		if ( decorator.label && localizedDecoratorsLabels[ decorator.label ] ) {
			decorator.label = localizedDecoratorsLabels[ decorator.label ];
		}
		return decorator;
	} );

	return decorators;
}

/**
 * Converts an object with defined decorators to a normalized array of decorators. The `id` key is added for each decorator and
 * is used as the attribute's name in the model.
 *
 * @param {Object.<String, module:invite/invite~InviteDecoratorDefinition>} decorators
 * @returns {Array.<module:invite/invite~InviteDecoratorDefinition>}
 */
export function normalizeDecorators( decorators ) {
	const retArray = [];

	if ( decorators ) {
		for ( const [ key, value ] of Object.entries( decorators ) ) {
			const decorator = Object.assign(
				{},
				value,
				{ id: `invite${ upperFirst( key ) }` }
			);
			retArray.push( decorator );
		}
	}

	return retArray;
}

/**
 * Returns `true` if the specified `element` can be inviteed (the element allows the `inviteHref` attribute).
 *
 * @params {module:engine/model/element~Element|null} element
 * @params {module:engine/model/schema~Schema} schema
 * @returns {Boolean}
 */
export function isInviteableElement( element, schema ) {
	if ( !element ) {
		return false;
	}

	return schema.checkAttribute( element.name, 'inviteHref' );
}

/**
 * Returns `true` if the specified `value` is an email.
 *
 * @params {String} value
 * @returns {Boolean}
 */
export function isEmail( value ) {
	return EMAIL_REG_EXP.test( value );
}

/**
 * Adds the protocol prefix to the specified `invite` when:
 *
 * * it does not contain it already, and there is a {@invite module:invite/invite~InviteConfig#defaultProtocol `defaultProtocol` }
 * configuration value provided,
 * * or the invite is an email address.
 *
 *
 * @params {String} invite
 * @params {String} defaultProtocol
 * @returns {Boolean}
 */
export function addInviteProtocolIfApplicable( invite, defaultProtocol ) {
	const protocol = isEmail( invite ) ? '' : defaultProtocol;
	const isProtocolNeeded = !!protocol && !PROTOCOL_REG_EXP.test( invite );

	return invite && isProtocolNeeded ? protocol + invite : invite;
}

/**
 * Opens the invite in a new browser tab.
 *
 * @param {String} invite
 */
export function openInvite( invite ) {
	window.open( invite, '_blank', 'noopener' );
}
