/** Take a string with each character offset by a specific number in the ASCII table and return a string,
 *  with each character offset by the `offset` value. Should be used for obfuscating the email. E.g.
 *
 *  Support.offsetString("your@email.de", 1) -> "zpvsAfnbjm/ef"
 *
 *  Support.offsetString("zpvsAfnbjm/ef", -1) -> "your@email.de"
 *
 *  */
function offsetString(string, offset = -1) {
    let charOffset = (o) => (c) => String.fromCharCode(c.charCodeAt(0) + o);
    return _.map(charOffset(offset))(string).flat().join("");
}

function sendEmail(encodedAddress, subject = '', body = '', cc = '', bcc = '') {  
    // Note: The offset here needs to be the opposite of what was used to create the encoded
    //       email in the _config.yaml.
    let mailLink = "mailto:" + offsetString(encodedAddress, -1) +
        "?cc=" + cc +
        "&bcc=" + bcc +
        "&subject=" + subject +
        "&body=" + body;
    let uriEncodedMailLink = encodeURI(mailLink);
    window.open(uriEncodedMailLink, "_blank");
}

function formatEmailForDisplay(encodedAddress) {
    let decryptedEmail = offsetString(encodedAddress, -1);
    let printableEmail = decryptedEmail.replace("@", "[@]").replace(".", "[.]");
    return printableEmail;
}