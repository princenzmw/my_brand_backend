import Message from '../models/messageModel.js';

export const createMessage = async function (req, res) {
  const { text } = req.body;

  try {
    const message = await Message.create({
      user: req.user.userId,
      text,
    });

    return res.status(200).json(message);
  } catch (error) {
    return res.status(500).json({ message: 'There was a problem creating this message.', error: error.message });
  }
};

export const getMessages = async function (req, res) {
  try {
    const messages = await Message.find().populate('user', 'username');

    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ message: 'There was a problem fetching messages.', error: error.message });
  }
};

export const deleteMessage = async function (req, res) {
  try {
    await Message.findByIdAndRemove(req.params.id);

    return res.status(200).json({ message: 'Message deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'There was a problem deleting this message.', error: error.message });
  }
};
