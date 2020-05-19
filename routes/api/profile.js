const express= require('express');
const router= express.Router();
const auth=require('../../middleware/auth');
const { check, validationResult } = require('express-validator');


const Profile=require('../../models/Profile');
const User=require('../../models/User');

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



module.exports=router;