const express= require('express');
const router= express.Router();
const auth=require('../../middleware/auth');
const { check, validationResult } = require('express-validator');


const Profile=require('../../models/Profile');
const User=require('../../models/User');
const Post=require('../../models/Post');

router.get('/me',auth, async(req,res)=>{
    try{
        const profile=await Profile.findOne({user: req.user.id}).populate('user',['name','avatar']);
        if(!profile){
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }
        res.json(profile);
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


router.post(
    '/',
    [auth,
        [
        check('status','Status is required').not().isEmpty(),
        check('skills','skills is required').not().isEmpty()
        ]
    ], 
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {company,website,location,status,skills,bio}=req.body;

        const profileFields={};
        profileFields.user=req.user.id;
        if(company) profileFields.company=company;
        if(website) profileFields.website=website;
        if(location) profileFields.location=location;
        if(status) profileFields.status=status;
        if(bio) profileFields.bio=bio;
        if(skills) {
            profileFields.skills=skills.split(',').map(skill=>skill.trim());
        }

        try{
            let profile= await Profile.findOne({user: req.user.id});
  
            if(profile){
                //update purpose
                profile=await Profile.findOneAndUpdate({user: req.user.id},{$set: profileFields},{new:true});
                return res.json(profile);
            }

            //create purpose
            profile=new Profile(profileFields);
            await profile.save();
            res.json(profile);


        }catch(err){
            console.error(err.message);
            res.status(500).send('server error');
        }


    });

//To get all profiles
router.get('/',async (req,res)=>{
    try {
        const profiles=await Profile.find().populate('user',['name','avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

//To get profile by user_id
router.get('/user/:user_id',async (req,res)=>{
    try {
        const profile=await Profile.findOne({user: req.params.user_id}).populate('user',['name','avatar']);
        if(!profile){
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        if(err.kind=='ObjectId'){
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }
        res.status(500).send('server error');
    }
});

//To delete profile,user and posts
router.delete('/',auth,async (req,res)=>{
    try {
        //Remove user posts
        await Post.deleteMany({user: req.user.id});
        //Remove profile
        await Profile.findOneAndRemove({user: req.user.id});
        //Remove user
        await User.findOneAndRemove({_id: req.user.id});
        res.json('User deleted');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

//update experience
router.put('/experience',[auth,[
    check('title','Title is required').not().isEmpty(),
    check('company','Company is required').not().isEmpty(),
    check('from','From date is required').not().isEmpty()
]],async (req,res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const {title,company,location,from,to,current,description}=req.body;

    const newExp={title,company,location,from,to,current,description}

    try {
        const profile=await Profile.findOne({user: req.user.id});
        profile.experience.unshift(newExp);
        await profile.save();
        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

//delete experience
router.delete('/experience/:exp_id',auth,async (req,res)=>{
    try {
        const profile=await Profile.findOne({user: req.user.id});

        //get remove index
        const removeIndex=profile.experience.map(item=>item.id).indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex,1);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});



module.exports=router;