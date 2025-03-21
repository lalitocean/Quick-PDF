// bot.js
import { Telegraf } from 'telegraf';
import { User } from './models/user.modal.js';
import { ContentModal } from './models/content.modal.js';
import { Feedback } from './models/feedback.modal.js';
import PDFdocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();
const __dirname = import.meta.dirname
const bot = new Telegraf(process.env.TELIGRAM_BOT_KEY);


// & keyboard helper function 
const inlineKeyboardHelper = (ctx, text, keyboard) => {
    ctx.deleteMessage()
    ctx.telegram.sendMessage(ctx.chat.id, text, {
        reply_markup: {
            inline_keyboard: keyboard,
            resize_keyboard: true
        }
    })
}

bot.start(async (ctx) => {
    try {

        ctx.sendChatAction('typing');
        const from = ctx.update.message.from;
        // saving the data in the database 
        const user = await User.findOneAndUpdate({ tgId: from.id }, {
            $setOnInsert: {
                firstName: from.first_name,
                lastName: from.last_name,
                userName: from.username,
                isBot: from.is_bot,
            },
        }, { upsert: true, new: true });

        ctx.reply(`
 Hi, ${user.firstName} ! Welcome to the PDF Generator bot.
 You can quickly create a PDF by adding your desired content here.
 Type your content, use /space to separate paragraphs, and /generate to create the PDF! 
 Type /help commands to see the guide and list of commands.
     
     `)
        inlineKeyboardHelper(ctx, "Set the page layout", [[{ text: "Narrow(default)", callback_data: "narrow" }, { text: "Normal", callback_data: "normal" }, { text: "Medium", callback_data: "medium" }]])

    } catch (error) {
        console.log(error);
        await ctx.reply("Facing difficulties");
    }
});


// & columns action helper function 
const mainMenuHelperfunction = (ctx) => {
    inlineKeyboardHelper(ctx, 'Back to Main', [[{ text: "Go-Back", callback_data: "goBack" }]])
}
// & margins action helper function 
const columnHelperfunction = (ctx) => {
    inlineKeyboardHelper(ctx, 'Choose the columns', [[{ text: "1", callback_data: "firstColumn" }, { text: "2", callback_data: "secondColumn" }, { text: "3(Default)", callback_data: "thirdColumn" }]])
}

// & font size helper function 
const fontSizeHelperFunction = (ctx) => {
    inlineKeyboardHelper(ctx, 'Choose the font size', [[{ text: "7(default)", callback_data: "7" }, { text: "8", callback_data: "8" }, { text: "9", callback_data: "9" }, { text: "10", callback_data: "10" }, { text: "11", callback_data: "11" }, { text: "12", callback_data: "12" }, { text: "13", callback_data: "13" }]])
}
// handling margins actions here
bot.action(['narrow', 'normal', 'medium'], async (ctx) => {
    // * needs to store the page layout setting in the database 

    const layout = ctx.update.callback_query.data
    const from = ctx.update.callback_query.from

    // * save the doc if the layout value is different form the default value('narrow')
    if (layout === 'normal' || layout === 'medium') {
        await ContentModal.findOneAndUpdate(
            { tgId: from.id },
            { $set: { marginValue: layout } },
            { upsert: true }
        );
    }

    columnHelperfunction(ctx);
})

// handling columns actions here
bot.action(['firstColumn', 'secondColumn', 'thirdColumn'], async (ctx) => {

    // ^ save th column setting in the database 
    const columnCount = ctx.update.callback_query.data
    const from = ctx.update.callback_query.from

    if (columnCount === 'firstColumn') {
        await ContentModal.findOneAndUpdate(
            { tgId: from.id },
            { $set: { columnValue: 1 } },
            { upsert: true }
        );
    }
    if (columnCount === 'secondColumn') {
        await ContentModal.findOneAndUpdate(
            { tgId: from.id },
            { $set: { columnValue: 2 } },
            { upsert: true }
        );
    }

    fontSizeHelperFunction(ctx)
})
// handling font size here
bot.action(['7', '8', '9', '10', '11', '12', '13'], async (ctx) => {
    try {
        // ^ save th column setting in the database 
        const pagefontSize = parseInt(ctx.update.callback_query.data)
        const from = ctx.update.callback_query.from

        // save the setting in the database 
        if (pagefontSize !== 7) {

            await ContentModal.findOneAndUpdate(
                { tgId: from.id },
                { $set: { fontSize: pagefontSize } },
                { upsert: true }
            );
        }
        mainMenuHelperfunction(ctx)
    } catch (error) {
        console.log(error)
    }
})
// & GO BACK ACTION 
bot.action('goBack', (ctx) => {
    inlineKeyboardHelper(ctx, "set the page layout", [[{ text: "Narrow", callback_data: "narrow" }, { text: "Normal", callback_data: "normal" }, { text: "Medium)", callback_data: "medium" }]])
})

// * creating inline keyboard for taking user layout (columns number), page margin from sides(narrow, normal, medium)

bot.command('space', async (ctx) => {
    try {
        const from = ctx.update.message.from;
        const findContent = await ContentModal.findOne({ tgId: from.id });

        if (!findContent) {
            return ctx.reply("You haven't added any content yet.");
        }

        const lastElementIndex = findContent.contents.length - 1;


        if (lastElementIndex >= 0) {
            findContent.contents[lastElementIndex].moveDown = true;
            await findContent.save();
            return ctx.reply("space added!");
        } else {
            return ctx.reply("No content to give space");
        }

    } catch (error) {
        ctx.reply("Facing difficulties");
    }
});

bot.command('help', (ctx) => {
    ctx.reply(`
 Process
 
 manage setting(optional) /setting.
 Simply send your message without any commands.
 After sending the content, you can use the /space command to separate paragraphs.
 Once you've added all the content you want, use the /generate command to create your PDF.

 Note: use /reset command before generating new pdf 
 
 Commands List:
 
 /space: Use this command to add space after a paragraph.
 /generate: use this command to generate the PDF. 
 /reset: This command resets all settings and deletes the current content.
 /feedback: Share your feedback with us! Example: /feedback Your message here (max 50 characters, up to 4 times).
 /drink: If you feel that the service is worthy.
 
 Default Settings for the page.
 
 Page margin --> narrow, column in a page --> 3, font-size --> 7
 to manipulate the page setting give the /setting command 
     `)
})

bot.command('reset', async (ctx) => {
    try {
        const from = ctx.update.message.from;
        const findDoc = await ContentModal.findOneAndDelete({ tgId: from.id });
        if (!findDoc) {
            ctx.reply("You are already out, try things from scratch");
            return;
        }
        ctx.reply("Ok, all contents deleted. Start fresh!");
    } catch (error) {
        ctx.reply("Error during deleting the doc");
        console.error(error);
    }
});

bot.command('generate', async (ctx) => {
    try {
        ctx.sendChatAction('upload_document');
        const from = ctx.update.message.from;
        const now = new Date();
        const formattedDate = now.toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];

        const pdfDir = path.resolve(__dirname, 'pdfhere');
        try {
            if (!fs.existsSync(pdfDir)) {
                fs.mkdirSync(pdfDir, { recursive: true });
            }
        } catch (error) {
            console.error('Error creating directory:', error);
            ctx.reply('Sorry, there was an error creating the folder for saving the PDF.');
            return;
        }
        const randomStr = crypto.randomUUID();

        const filePath = path.join(pdfDir, `${formattedDate}_${randomStr.slice(0, 8)}_file.pdf`);
        const allContents = await ContentModal.findOne({ tgId: from.id });

        if (!allContents) {
            ctx.reply("You haven't added any content yet.");
            return;
        }

        // Getting the setting of the document before generating
        const { columnValue, marginValue, fontSize } = allContents;

        // Ensure columnValue is a valid number
        const columns = parseInt(columnValue) || 3; // Default to 3 if not valid

        // Initialize doc
        let doc;

        switch (marginValue) {
            case "normal":
                doc = new PDFdocument({ margin: 72 });
                break;

            case "medium":
                doc = new PDFdocument({
                    margins: {
                        top: 72,
                        bottom: 72,
                        left: 54,
                        right: 54
                    }
                });
                break;
            default:
                doc = new PDFdocument({ margin: 36 });
                break;
        }

        // Set font size 
        doc.fontSize(fontSize);
        let fullContent = '';

        allContents.contents.forEach(({ content, moveDown }, index) => {
            fullContent += content;
            if (moveDown) {
                fullContent += "\n\n"; // Add extra new lines where moveDown is true
            } else if (index < allContents.contents.length - 1) {
                fullContent += "\n"; // Add a single newline between content entries
            }
        });

        // Add all content at once
        doc.text(fullContent, { columns: columnValue, align: 'justify' });

        // Create write stream to save the document
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);
        doc.end();

        writeStream.on('finish', async () => {
            // Check if the file exists after writing has finished
            if (fs.existsSync(filePath)) {
                await ctx.sendDocument({ source: filePath });
                fs.unlinkSync(filePath); // Delete the file after sending it
            } else {
                console.error('Generated PDF not found:', filePath);
                ctx.reply('Not able to send the PDF');
            }
        });

    } catch (error) {
        console.error("Error generating PDF:", error);
        ctx.reply("Error generating PDF, please try again later.");
    }
});
bot.command('setting', (ctx) => {
    try {
        inlineKeyboardHelper(ctx, "Set the page layout", [[{ text: "Narrow", callback_data: "narrow" }, { text: "Normal", callback_data: "normal" }, { text: "Medium)", callback_data: "medium" }]])
    } catch (error) {
        ctx.reply("facing difficulties , try again later")
    }
})
bot.command('feedback', async (ctx) => {

    try {
        //* check if the user exists in the database or not 
        const from = ctx.update.message.from;
        let user = await User.findOne({ tgId: from.id });  // Use findOne for tgId instead of findById

        if (!user) {
            user = new User({
                tgId: from.id,
                firstName: from.first_name,
                lastName: from.last_name,
            });
            await user.save();
        }

        // Storing the feedback in the database 
        const feedbackMessage = ctx.update.message.text


        // Find feedback for the user
        let findFeedback = await Feedback.findOne({ user: user._id });  // Use findOne and search by user._id

        if (!findFeedback) {
            // If no feedback found, create a new feedback entry with an initial count of 5
            findFeedback = new Feedback({
                user: user._id,
                message: [feedbackMessage],
                count: 4  // Allow 5 feedbacks, so count starts at 4
            });
            await findFeedback.save();
        } else {
            // If feedback already exists, check if the user has reached the feedback limit
            if (findFeedback.count === 0) {
                ctx.reply(`You have reached the maximum feedback limit of 5.`);
                return;  // Exit if the feedback limit is reached
            }

            // If not reached the limit, push the new feedback message
            findFeedback.messages.push(feedbackMessage);
            findFeedback.count -= 1;  // Decrement count

            // Save the updated feedback
            await findFeedback.save();
        }

        ctx.reply('Thank you for your feedback!');  // Confirmation message
    } catch (error) {
        console.log(error);
        ctx.reply("We're facing some difficulties. Please try again later.");
    }
});
bot.command('drink', (ctx) => {
    const filePath = path.resolve(__dirname, 'phonepay.jpg');
    ctx.replyWithPhoto({ source: filePath });
})

bot.on('message', async (ctx) => {
    const content = ctx.update.message.text;
    const from = ctx.update.message.from;
    try {
        const user = await User.findOneAndUpdate({ tgId: from.id }, {
            $setOnInsert: {
                firstName: from.first_name,
                lastName: from.last_name,
                isBot: from.is_bot,
            },
        }, { upsert: true, new: true });


        const findContent = await ContentModal.findOne({ tgId: from.id });
        if (!findContent) {
            const newContentDoc = new ContentModal({
                tgId: from.id,
                contents: [{ content: content, moveDown: false, createdAt: new Date() }],
            });
            await newContentDoc.save();
        } else {
            findContent.contents.push({ content, moveDown: false, createdAt: new Date() });
            await findContent.save();
        }

        ctx.reply("Content added! Keep adding more content like before. Use /add to start new content and /generate to create the PDF.");
    } catch (error) {
        console.log(error);
        ctx.reply("Facing difficulties, try again later.");
    }
});


export default bot;
