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

function sendMail(subject, body, cc = '', bcc = '') {
    // ATTENTION! This mail address might be scraped from the page for spam.
    let recepientMail = "temp@robot-mail.com"; //getnada dot com

    let mailLink = "mailto:" + recepientMail +
        "?cc=" + cc +
        "&bcc=" + bcc +
        "&subject=" + subject +
        "&body=" + body;
    let encodedMailLink = encodeURI(mailLink);
    window.open(encodedMailLink, "_blank");
}

function sendContactEmail(encodedAddress) {
    // Note: The offset here needs to be the opposite of what was used to create the encoded
    //       email in the _config.yaml.
    window.open('mailto:' + offsetString(encodedAddress, -1));
}

function formatEmailForDisplay(encodedAddress) {
    let decryptedEmail = offsetString(encodedAddress, -1);
    let printableEmail = decryptedEmail.replace("@", "[@]").replace(".", "[.]");
    return printableEmail;
}