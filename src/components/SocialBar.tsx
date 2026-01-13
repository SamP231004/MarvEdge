'use client';

import {
    IconBrandGithub,
    IconBrandLinkedin,
    IconBrandX,
    IconWorld
} from '@tabler/icons-react';

const socialLinks = [
    { link:"https://samp231004.github.io/Portfolio/", icon: IconWorld },
    { link: "https://github.com/SamP231004", icon: IconBrandGithub },
    { link: "https://www.linkedin.com/in/samp2310", icon: IconBrandLinkedin },
    { link: "https://x.com/Sam231004", icon: IconBrandX },
];

export default function SocialBar() {
    return (
        <div className="fixed right-6 bottom-6 flex flex-col items-center gap-6 z-50">
            <div className="flex flex-col items-center gap-4">
                {socialLinks.map((item, index) => (
                    <a
                        key={index}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-aquamarine hover:text-[#64ffda] transition"
                    >
                        <item.icon stroke={2} size={24} />
                    </a>
                ))}
            </div>
        </div>
    );
}
